import { EventEmitter } from 'events';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const AsteriskManager = require('asterisk-manager');

/**
 * Isabel VoIP Service — Asterisk Manager Interface (AMI)
 * Connects to Issabel 4 / Asterisk 11.25.3 via AMI TCP on port 5038.
 * Supports: click-to-call (Originate), call recording (MixMonitor), Hangup.
 * Does NOT use HTTP REST, SIP libraries, or simulated responses.
 */

export interface VoipCall {
  callId: string;
  phoneNumber: string;
  contactName: string;
  callType: 'inbound' | 'outbound';
  status: 'initiated' | 'ringing' | 'connected' | 'ended' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  recordingEnabled: boolean;
  recordingUrl?: string;
  /** AMI channel name captured from Bridge event, used for Hangup/MixMonitor */
  _channel?: string;
}

export interface VoipSettings {
  serverAddress: string;
  port: number;
  username: string;
  password: string;
  enabled: boolean;
  callRecordingEnabled: boolean;
  recordingStoragePath: string;
}

export class IsabelVoipService extends EventEmitter {
  private settings: VoipSettings | null = null;
  private activeCalls: Map<string, VoipCall> = new Map();
  private _isConnected: boolean = false;
  private ami: any = null;

  constructor() {
    super();
  }

  get isConnected(): boolean {
    if (!this.ami) return false;
    try {
      return typeof this.ami.isConnected === 'function'
        ? this.ami.isConnected()
        : this._isConnected;
    } catch {
      return this._isConnected;
    }
  }

  isServiceConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Configure the AMI service and connect.
   * Returns true if the AMI connection is established.
   */
  async configure(settings: VoipSettings): Promise<boolean> {
    this.settings = settings;

    if (!settings.enabled) {
      return false;
    }

    // Tear down any previous connection before reconfiguring
    await this.disconnect();

    return this.connect();
  }

  /**
   * Connect to Issabel/Asterisk AMI on port 5038.
   */
  async connect(): Promise<boolean> {
    if (!this.settings) {
      throw new Error('VoIP service not configured');
    }

    const { serverAddress, port, username, password } = this.settings;

    return new Promise<boolean>((resolve) => {
      let resolved = false;

      const safeResolve = (value: boolean) => {
        if (!resolved) {
          resolved = true;
          resolve(value);
        }
      };

      const connectTimeout = setTimeout(() => {
        console.error(`Isabel AMI connect timeout to ${serverAddress}:${port}`);
        this._isConnected = false;
        safeResolve(false);
      }, 8000);

      try {
        // asterisk-manager auto-connects and auto-logins on construction when port is provided
        this.ami = new AsteriskManager(port, serverAddress, username, password, true);
        this.ami.keepConnected();

        this.ami.on('connect', () => {
          clearTimeout(connectTimeout);
          this._isConnected = true;
          console.log(`Isabel AMI connected to ${serverAddress}:${port}`);
          this.emit('connected', { server: serverAddress, port, username });
          safeResolve(true);
        });

        this.ami.on('close', () => {
          this._isConnected = false;
          this.emit('disconnected');
          console.log('Isabel AMI connection closed');
        });

        this.ami.on('end', () => {
          this._isConnected = false;
          this.emit('disconnected');
        });

        this.ami.on('error', (err: any) => {
          this._isConnected = false;
          console.error('Isabel AMI error:', err?.message || err);
          safeResolve(false);
        });

        // Subscribe to call lifecycle events
        this.ami.on('bridge', this.onBridgeEvent.bind(this));
        this.ami.on('hangup', this.onHangupEvent.bind(this));

      } catch (err: any) {
        clearTimeout(connectTimeout);
        console.error('Isabel AMI failed to initialize:', err?.message || err);
        this._isConnected = false;
        safeResolve(false);
      }
    });
  }

  /**
   * Test the AMI connection by sending a Ping action and expecting a Pong response.
   * Uses a short-lived connection so it does not affect the persistent connection.
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!this.settings) {
      return { success: false, message: 'VoIP service not configured' };
    }

    const { serverAddress, port, username, password } = this.settings;

    return new Promise((resolve) => {
      let settled = false;

      const done = (result: { success: boolean; message: string; details?: any }) => {
        if (!settled) {
          settled = true;
          try { testAmi.disconnect(); } catch { /* ignore */ }
          resolve(result);
        }
      };

      const timeout = setTimeout(() => {
        done({
          success: false,
          message: `AMI connection timeout to ${serverAddress}:${port}`,
          details: { status: 'timeout', server: serverAddress, port }
        });
      }, 8000);

      let testAmi: any;
      try {
        testAmi = new AsteriskManager(port, serverAddress, username, password, false);

        testAmi.on('connect', () => {
          // Send Ping to verify authentication and responsiveness
          testAmi.action({ action: 'ping' }, (err: any, res: any) => {
            clearTimeout(timeout);
            if (err) {
              done({
                success: false,
                message: `AMI authenticated but Ping failed: ${err.message || err}`,
                details: { status: 'ping_failed', server: serverAddress, port, error: err.message }
              });
            } else {
              done({
                success: true,
                message: `Isabel AMI connection verified (${serverAddress}:${port})`,
                details: {
                  status: 'connected',
                  server: serverAddress,
                  port,
                  username,
                  ping: res?.ping || 'Pong',
                  asteriskVersion: res?.asteriskversionstring || 'Asterisk 11'
                }
              });
            }
          });
        });

        testAmi.on('error', (err: any) => {
          clearTimeout(timeout);
          done({
            success: false,
            message: `AMI connection failed: ${err?.message || 'Connection refused or credentials invalid'}`,
            details: { status: 'error', server: serverAddress, port, error: err?.message }
          });
        });

      } catch (err: any) {
        clearTimeout(timeout);
        done({
          success: false,
          message: `AMI initialization error: ${err?.message || err}`,
          details: { status: 'init_error', error: err?.message }
        });
      }
    });
  }

  /**
   * Initiate an outbound call via AMI Originate (Asterisk 11 click-to-call).
   * Rings the agent's SIP extension first; on answer, bridges to the customer number.
   */
  async initiateCall(
    phoneNumber: string,
    contactName: string,
    options: { recordCall?: boolean } = {}
  ): Promise<VoipCall> {
    if (!this.settings) {
      throw new Error('VoIP service not configured');
    }
    if (!this.isConnected || !this.ami) {
      throw new Error('Isabel AMI is not connected. Check VoIP server address and credentials.');
    }

    const callId = `ami_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const recordingEnabled = options.recordCall ?? this.settings.callRecordingEnabled;

    const call: VoipCall = {
      callId,
      phoneNumber,
      contactName,
      callType: 'outbound',
      status: 'initiated',
      startTime: new Date(),
      recordingEnabled,
    };

    this.activeCalls.set(callId, call);

    return new Promise((resolve, reject) => {
      const originateAction: Record<string, any> = {
        action: 'originate',
        channel: `SIP/${this.settings!.username}`,
        context: 'from-internal',
        exten: phoneNumber,
        priority: 1,
        callerid: `${contactName} <${phoneNumber}>`,
        async: 'true',
        actionid: callId,
        variable: { CALLID: callId }
      };

      this.ami.action(originateAction, (err: any, res: any) => {
        if (err) {
          call.status = 'failed';
          call.endTime = new Date();
          this.activeCalls.delete(callId);
          console.error(`Isabel AMI Originate failed for ${phoneNumber}:`, err);
          reject(new Error(`Call origination failed: ${err.message || err}`));
        } else {
          call.status = 'ringing';
          this.emit('callInitiated', call);
          console.log(`Isabel AMI call initiated to ${phoneNumber}, callId=${callId}`);
          resolve(call);
        }
      });
    });
  }

  /**
   * End an active call by sending a Hangup action on the stored AMI channel.
   */
  async endCall(callId: string): Promise<{ success: boolean; duration?: number; recordingUrl?: string }> {
    const call = this.activeCalls.get(callId);
    if (!call) {
      return { success: false };
    }

    if (!this.ami || !this.isConnected) {
      call.status = 'ended';
      call.endTime = new Date();
      call.duration = Math.floor((call.endTime.getTime() - call.startTime.getTime()) / 1000);
      this.activeCalls.delete(callId);
      return { success: true, duration: call.duration, recordingUrl: call.recordingUrl };
    }

    return new Promise((resolve) => {
      const channel = call._channel;

      if (!channel) {
        // No channel tracked yet — mark as ended locally
        call.status = 'ended';
        call.endTime = new Date();
        call.duration = Math.floor((call.endTime.getTime() - call.startTime.getTime()) / 1000);
        this.activeCalls.delete(callId);
        this.emit('callEnded', call);
        resolve({ success: true, duration: call.duration, recordingUrl: call.recordingUrl });
        return;
      }

      this.ami.action({ action: 'hangup', channel }, (err: any) => {
        call.status = 'ended';
        call.endTime = new Date();
        call.duration = Math.floor((call.endTime.getTime() - call.startTime.getTime()) / 1000);
        this.activeCalls.delete(callId);
        this.emit('callEnded', call);

        if (err) {
          console.error(`AMI Hangup error for ${channel}:`, err);
          resolve({ success: false });
        } else {
          resolve({ success: true, duration: call.duration, recordingUrl: call.recordingUrl });
        }
      });
    });
  }

  getCall(callId: string): VoipCall | undefined {
    return this.activeCalls.get(callId);
  }

  /**
   * Disconnect from the AMI server.
   */
  async disconnect(): Promise<void> {
    if (this.ami) {
      try {
        this.ami.disconnect();
      } catch { /* ignore */ }
      this.ami = null;
    }
    this._isConnected = false;
    this.emit('disconnected');
  }

  // ---------------------------------------------------------------------------
  // AMI event handlers
  // ---------------------------------------------------------------------------

  private onBridgeEvent(evt: any) {
    // Find the call matching the CALLID channel variable
    for (const [callId, call] of this.activeCalls.entries()) {
      if (
        evt.callerid1 === call.phoneNumber ||
        evt.callerid2 === call.phoneNumber ||
        (evt.uniqueid1 && callId.includes(evt.uniqueid1)) ||
        (evt.variable && evt.variable['CALLID'] === callId)
      ) {
        const channel = evt.channel1 || evt.channel2 || evt.channel;
        if (channel) {
          call._channel = channel;
        }
        call.status = 'connected';
        this.emit('callConnected', call);
        console.log(`Isabel AMI: call ${callId} bridged on channel ${channel}`);

        // Start MixMonitor for recording if enabled
        if (call.recordingEnabled && channel && this.settings) {
          const recordingPath = `${this.settings.recordingStoragePath}/${callId}.wav`;
          this.ami.action(
            { action: 'mixmonitor', channel, file: recordingPath },
            (err: any) => {
              if (err) {
                console.error(`MixMonitor failed for ${channel}:`, err);
              } else {
                call.recordingUrl = recordingPath;
                console.log(`MixMonitor started: ${recordingPath}`);
              }
            }
          );
        }
        break;
      }
    }
  }

  private onHangupEvent(evt: any) {
    // Find call by stored channel name
    for (const [callId, call] of this.activeCalls.entries()) {
      if (call._channel && (call._channel === evt.channel || call._channel === evt.uniqueid)) {
        call.status = 'ended';
        call.endTime = new Date();
        call.duration = Math.floor((call.endTime.getTime() - call.startTime.getTime()) / 1000);
        this.activeCalls.delete(callId);
        this.emit('callEnded', call);
        console.log(`Isabel AMI: call ${callId} ended, duration=${call.duration}s`);
        break;
      }
    }
  }
}

export const isabelVoipService = new IsabelVoipService();

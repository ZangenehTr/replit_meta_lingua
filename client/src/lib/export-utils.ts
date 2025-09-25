// Export utilities for caller history dashboard
import { format } from 'date-fns';
import { json2csv } from 'json2csv';

export interface ExportData {
  id: number;
  type: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  interactionTime: string;
  status: string;
  outcome: string;
  urgencyLevel: string;
  handlerName: string;
  notes: string;
  tags: string[];
  convertedToLead: boolean;
  convertedToStudent: boolean;
  followUpRequired: boolean;
  followUpDate?: string;
}

export interface AnalyticsExportData {
  totalInteractions: number;
  conversionRate: number;
  channelPerformance: Array<{
    channel: string;
    interactions: number;
    conversions: number;
    conversionRate: number;
  }>;
  topPerformers: Array<{
    name: string;
    interactions: number;
    conversions: number;
  }>;
}

// Export interactions to CSV
export const exportInteractionsToCSV = (interactions: ExportData[], filename?: string): void => {
  try {
    const csvData = interactions.map(interaction => ({
      'ID': interaction.id,
      'Type': interaction.type,
      'Customer Name': interaction.customerName,
      'Phone': interaction.customerPhone,
      'Email': interaction.customerEmail,
      'Date/Time': format(new Date(interaction.interactionTime), 'yyyy-MM-dd HH:mm:ss'),
      'Status': interaction.status,
      'Outcome': interaction.outcome,
      'Urgency': interaction.urgencyLevel,
      'Handler': interaction.handlerName,
      'Notes': interaction.notes,
      'Tags': interaction.tags.join(', '),
      'Converted to Lead': interaction.convertedToLead ? 'Yes' : 'No',
      'Converted to Student': interaction.convertedToStudent ? 'Yes' : 'No',
      'Follow-up Required': interaction.followUpRequired ? 'Yes' : 'No',
      'Follow-up Date': interaction.followUpDate ? format(new Date(interaction.followUpDate), 'yyyy-MM-dd') : ''
    }));

    const csv = json2csv(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename || `caller-history-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw new Error('Failed to export CSV file');
  }
};

// Export analytics to CSV
export const exportAnalyticsToCSV = (analytics: AnalyticsExportData, filename?: string): void => {
  try {
    const csvData = [
      {
        'Metric': 'Total Interactions',
        'Value': analytics.totalInteractions.toString(),
        'Details': ''
      },
      {
        'Metric': 'Conversion Rate',
        'Value': `${analytics.conversionRate.toFixed(2)}%`,
        'Details': ''
      },
      ...analytics.channelPerformance.map(channel => ({
        'Metric': 'Channel Performance',
        'Value': channel.channel,
        'Details': `${channel.interactions} interactions, ${channel.conversions} conversions (${channel.conversionRate.toFixed(2)}%)`
      })),
      ...analytics.topPerformers.map(performer => ({
        'Metric': 'Top Performer',
        'Value': performer.name,
        'Details': `${performer.interactions} interactions, ${performer.conversions} conversions`
      }))
    ];

    const csv = json2csv(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename || `analytics-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error exporting analytics to CSV:', error);
    throw new Error('Failed to export analytics CSV file');
  }
};

// Generate PDF report (basic implementation)
export const generatePDFReport = async (interactions: ExportData[], analytics?: AnalyticsExportData): Promise<void> => {
  try {
    // Create a simple HTML representation for PDF generation
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Caller History Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .summary { background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .conversion-yes { color: #28a745; font-weight: bold; }
            .conversion-no { color: #dc3545; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>Caller History Report</h1>
          <p>Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</p>
          
          ${analytics ? `
            <div class="summary">
              <h2>Summary</h2>
              <p><strong>Total Interactions:</strong> ${analytics.totalInteractions}</p>
              <p><strong>Conversion Rate:</strong> ${analytics.conversionRate.toFixed(2)}%</p>
            </div>
          ` : ''}
          
          <h2>Interaction Details</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Date/Time</th>
                <th>Status</th>
                <th>Handler</th>
                <th>Converted</th>
              </tr>
            </thead>
            <tbody>
              ${interactions.map(interaction => `
                <tr>
                  <td>${interaction.id}</td>
                  <td>${interaction.type}</td>
                  <td>${interaction.customerName}</td>
                  <td>${interaction.customerPhone}</td>
                  <td>${format(new Date(interaction.interactionTime), 'yyyy-MM-dd HH:mm')}</td>
                  <td>${interaction.status}</td>
                  <td>${interaction.handlerName}</td>
                  <td class="${(interaction.convertedToLead || interaction.convertedToStudent) ? 'conversion-yes' : 'conversion-no'}">
                    ${(interaction.convertedToLead || interaction.convertedToStudent) ? 'Yes' : 'No'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Open print dialog with the content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      throw new Error('Unable to open print window');
    }
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw new Error('Failed to generate PDF report');
  }
};

// Export customer profile data
export const exportCustomerProfile = (profile: any, interactions: ExportData[]): void => {
  try {
    const profileData = {
      'Customer Information': {
        'Name': profile.customerName,
        'Phone': profile.customerPhone,
        'Email': profile.customerEmail,
        'Total Interactions': profile.totalInteractions,
        'First Contact': format(new Date(profile.firstInteractionDate), 'yyyy-MM-dd'),
        'Last Contact': format(new Date(profile.lastInteractionDate), 'yyyy-MM-dd'),
        'Conversion Status': profile.conversionStatus,
        'Lead Source': profile.leadSource,
        'Interested Languages': profile.interestedLanguages.join(', '),
        'Current Level': profile.currentLevel,
        'Budget': profile.budget ? `$${profile.budget}` : 'Not specified',
        'Conversion Probability': `${profile.conversionProbability}%`
      }
    };

    const interactionDetails = interactions.map((interaction, index) => ({
      [`Interaction ${index + 1}`]: {
        'Type': interaction.type,
        'Date': format(new Date(interaction.interactionTime), 'yyyy-MM-dd HH:mm'),
        'Status': interaction.status,
        'Outcome': interaction.outcome,
        'Handler': interaction.handlerName,
        'Notes': interaction.notes,
        'Converted': (interaction.convertedToLead || interaction.convertedToStudent) ? 'Yes' : 'No'
      }
    }));

    const fullData = { ...profileData, ...Object.assign({}, ...interactionDetails) };
    
    // Convert to CSV format
    const csvRows = [];
    csvRows.push(['Section', 'Field', 'Value']);
    
    Object.entries(fullData).forEach(([section, fields]) => {
      Object.entries(fields as Record<string, string>).forEach(([field, value]) => {
        csvRows.push([section, field, value]);
      });
    });

    const csv = csvRows.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `customer-profile-${profile.customerName.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error exporting customer profile:', error);
    throw new Error('Failed to export customer profile');
  }
};

// Print timeline view
export const printTimeline = (customerName: string, interactions: ExportData[]): void => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Customer Timeline - ${customerName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
            .timeline-item { margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; background-color: #f8f9fa; }
            .timeline-date { font-weight: bold; color: #666; margin-bottom: 5px; }
            .timeline-type { background-color: #007bff; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px; margin-right: 10px; }
            .timeline-content { margin-top: 10px; }
            .timeline-status { color: #28a745; font-weight: bold; }
            .timeline-handler { color: #6c757d; font-style: italic; }
            @media print { body { margin: 0; } .timeline-item { page-break-inside: avoid; } }
          </style>
        </head>
        <body>
          <h1>Customer Timeline: ${customerName}</h1>
          <p>Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</p>
          <p>Total Interactions: ${interactions.length}</p>
          
          ${interactions.map(interaction => `
            <div class="timeline-item">
              <div class="timeline-date">${format(new Date(interaction.interactionTime), 'EEEE, MMMM d, yyyy - HH:mm')}</div>
              <div>
                <span class="timeline-type">${interaction.type.replace('_', ' ').toUpperCase()}</span>
                <span class="timeline-status">${interaction.status}</span>
                <span class="timeline-handler">Handled by: ${interaction.handlerName}</span>
              </div>
              <div class="timeline-content">
                <p><strong>Outcome:</strong> ${interaction.outcome}</p>
                <p><strong>Urgency:</strong> ${interaction.urgencyLevel}</p>
                ${interaction.notes ? `<p><strong>Notes:</strong> ${interaction.notes}</p>` : ''}
                ${interaction.tags.length > 0 ? `<p><strong>Tags:</strong> ${interaction.tags.join(', ')}</p>` : ''}
                ${(interaction.convertedToLead || interaction.convertedToStudent) ? 
                  `<p style="color: #28a745; font-weight: bold;">✓ Converted ${interaction.convertedToLead ? 'to Lead' : 'to Student'}</p>` : ''
                }
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      throw new Error('Unable to open print window');
    }
  } catch (error) {
    console.error('Error printing timeline:', error);
    throw new Error('Failed to print timeline');
  }
};

// Export search results
export const exportSearchResults = (results: ExportData[], searchQuery: string, filters: any): void => {
  try {
    const fileName = `search-results-${searchQuery ? searchQuery.replace(/\s+/g, '-') : 'all'}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    exportInteractionsToCSV(results, fileName);
  } catch (error) {
    console.error('Error exporting search results:', error);
    throw new Error('Failed to export search results');
  }
};
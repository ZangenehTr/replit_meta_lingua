import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../server/index';
import { db } from '../server/db';
import { users, peerMatchingRequests, peerSocializerGroups, peerSocializerParticipants } from '@shared/schema';
import { eq, inArray } from 'drizzle-orm';

describe('Peer Socializer System - Iranian Gender-Based Matching', () => {
  let authToken: string;
  let femaleUserId: number;
  let maleUser1Id: number;
  let maleUser2Id: number;
  let maleUser3Id: number;
  let createdUserIds: number[] = [];

  beforeEach(async () => {
    // Create test female user (age 22)
    const [femaleUser] = await db.insert(users).values({
      email: 'female@test.com',
      firstName: 'Sara',
      lastName: 'Ahmadi',
      role: 'Student',
      password: 'hashedpassword',
      gender: 'female',
      age: 22
    }).returning();
    femaleUserId = femaleUser.id;
    createdUserIds.push(femaleUserId);

    // Create test male users with different ages for priority testing
    const [maleUser1] = await db.insert(users).values({
      email: 'male1@test.com',
      firstName: 'Ali',
      lastName: 'Hosseini',
      role: 'Student',
      password: 'hashedpassword',
      gender: 'male',
      age: 25 // 3 years older than female (good match)
    }).returning();
    maleUser1Id = maleUser1.id;
    createdUserIds.push(maleUser1Id);

    const [maleUser2] = await db.insert(users).values({
      email: 'male2@test.com',
      firstName: 'Mohammad',
      lastName: 'Karimi',
      role: 'Student',
      password: 'hashedpassword',
      gender: 'male',
      age: 30 // 8 years older (still within 10 year limit)
    }).returning();
    maleUser2Id = maleUser2.id;
    createdUserIds.push(maleUser2Id);

    const [maleUser3] = await db.insert(users).values({
      email: 'male3@test.com',
      firstName: 'Reza',
      lastName: 'Mohammadi',
      role: 'Student',
      password: 'hashedpassword',
      gender: 'male',
      age: 35 // 13 years older (outside 10 year limit)
    }).returning();
    maleUser3Id = maleUser3.id;
    createdUserIds.push(maleUser3Id);

    authToken = 'mock-jwt-token';
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(peerSocializerParticipants).where(
      inArray(peerSocializerParticipants.userId, createdUserIds)
    );
    await db.delete(peerSocializerGroups);
    await db.delete(peerMatchingRequests).where(
      inArray(peerMatchingRequests.userId, createdUserIds)
    );
    await db.delete(users).where(inArray(users.id, createdUserIds));
    createdUserIds = [];
  });

  it('should create peer matching request successfully', async () => {
    const matchingData = {
      preferredLanguage: 'English',
      proficiencyLevel: 'Intermediate',
      interests: ['Business English', 'Conversation Practice'],
      preferredGender: 'opposite', // Iranian cultural preference
      maxGroupSize: 4
    };

    const response = await request(app)
      .post('/api/student/peer-matching/request')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', femaleUserId.toString())
      .send(matchingData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('matching request created');

    // Verify request was saved
    const savedRequests = await db
      .select()
      .from(peerMatchingRequests)
      .where(eq(peerMatchingRequests.userId, femaleUserId));
    
    expect(savedRequests).toHaveLength(1);
    expect(savedRequests[0].preferredLanguage).toBe('English');
    expect(savedRequests[0].preferredGender).toBe('opposite');
  });

  it('should apply Iranian gender-based matching algorithm correctly', async () => {
    // Create matching requests for all users
    const matchingData = {
      preferredLanguage: 'English',
      proficiencyLevel: 'Intermediate',
      interests: ['Conversation Practice'],
      preferredGender: 'opposite',
      maxGroupSize: 4
    };

    // Female user requests opposite gender matching
    await request(app)
      .post('/api/student/peer-matching/request')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', femaleUserId.toString())
      .send(matchingData);

    // Male users also request matching
    for (const maleId of [maleUser1Id, maleUser2Id, maleUser3Id]) {
      await request(app)
        .post('/api/student/peer-matching/request')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-test-user-id', maleId.toString())
        .send(matchingData);
    }

    // Trigger matching algorithm
    const response = await request(app)
      .post('/api/admin/peer-matching/run-algorithm')
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(response.status).toBe(200);

    // Verify matching results
    const groups = await db.select().from(peerSocializerGroups);
    expect(groups.length).toBeGreaterThan(0);

    const participants = await db.select().from(peerSocializerParticipants);
    
    // Should have participants from different genders
    const femaleParticipants = participants.filter(p => 
      createdUserIds.slice(0, 1).includes(p.userId) // Female user
    );
    const maleParticipants = participants.filter(p => 
      createdUserIds.slice(1).includes(p.userId) // Male users
    );

    expect(femaleParticipants.length).toBeGreaterThan(0);
    expect(maleParticipants.length).toBeGreaterThan(0);
  });

  it('should prioritize age-appropriate matches for Iranian culture', async () => {
    const matchingData = {
      preferredLanguage: 'English',
      proficiencyLevel: 'Intermediate',
      interests: ['Conversation Practice'],
      preferredGender: 'opposite',
      maxGroupSize: 4
    };

    // Create requests for female and all male users
    await request(app)
      .post('/api/student/peer-matching/request')
      .set('x-test-user-id', femaleUserId.toString())
      .send(matchingData);

    await request(app)
      .post('/api/student/peer-matching/request')
      .set('x-test-user-id', maleUser1Id.toString())
      .send(matchingData);

    await request(app)
      .post('/api/student/peer-matching/request')
      .set('x-test-user-id', maleUser2Id.toString())
      .send(matchingData);

    await request(app)
      .post('/api/student/peer-matching/request')
      .set('x-test-user-id', maleUser3Id.toString())
      .send(matchingData);

    // Get match candidates for female user
    const response = await request(app)
      .get('/api/student/peer-matching/candidates')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', femaleUserId.toString());

    expect(response.status).toBe(200);
    expect(response.body.candidates).toBeDefined();
    
    // Verify age priority: maleUser1 (25) and maleUser2 (30) should be preferred
    // over maleUser3 (35) due to 10-year age limit for boys older than girls
    const candidateIds = response.body.candidates.map((c: any) => c.userId);
    
    expect(candidateIds).toContain(maleUser1Id); // 3 years older - good match
    expect(candidateIds).toContain(maleUser2Id); // 8 years older - acceptable
    
    // maleUser3 (13 years older) should be excluded or deprioritized
    if (candidateIds.includes(maleUser3Id)) {
      // If included, should have lower priority score
      const maleUser3Candidate = response.body.candidates.find((c: any) => c.userId === maleUser3Id);
      const maleUser1Candidate = response.body.candidates.find((c: any) => c.userId === maleUser1Id);
      expect(maleUser1Candidate.matchScore).toBeGreaterThan(maleUser3Candidate.matchScore);
    }
  });

  it('should handle peer group creation with gender balance', async () => {
    const groupData = {
      name: 'English Practice Group',
      description: 'Daily English conversation practice',
      language: 'English',
      proficiencyLevel: 'Intermediate',
      maxParticipants: 6,
      isPrivate: false
    };

    const response = await request(app)
      .post('/api/student/peer-groups/create')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', femaleUserId.toString())
      .send(groupData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.group).toBeDefined();
    expect(response.body.group.name).toBe('English Practice Group');

    // Verify group was created
    const groups = await db.select().from(peerSocializerGroups);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('English Practice Group');
    expect(groups[0].createdBy).toBe(femaleUserId);
  });

  it('should join existing peer group successfully', async () => {
    // First create a group
    const [group] = await db.insert(peerSocializerGroups).values({
      name: 'Test Group',
      description: 'Test group for joining',
      language: 'English',
      proficiencyLevel: 'Intermediate',
      maxParticipants: 6,
      currentParticipants: 1,
      isPrivate: false,
      createdBy: femaleUserId
    }).returning();

    // Add creator as participant
    await db.insert(peerSocializerParticipants).values({
      groupId: group.id,
      userId: femaleUserId,
      joinedAt: new Date(),
      isActive: true
    });

    // Male user joins the group
    const response = await request(app)
      .post(`/api/student/peer-groups/${group.id}/join`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', maleUser1Id.toString());

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('joined group successfully');

    // Verify participation
    const participants = await db
      .select()
      .from(peerSocializerParticipants)
      .where(eq(peerSocializerParticipants.groupId, group.id));
    
    expect(participants).toHaveLength(2);
    expect(participants.map(p => p.userId)).toContain(maleUser1Id);
  });

  it('should get peer groups with Iranian cultural filtering', async () => {
    // Create diverse groups
    const [mixedGroup] = await db.insert(peerSocializerGroups).values({
      name: 'Mixed Practice Group',
      description: 'Open to all genders',
      language: 'English',
      proficiencyLevel: 'Intermediate',
      maxParticipants: 8,
      currentParticipants: 3,
      isPrivate: false,
      createdBy: femaleUserId
    }).returning();

    const response = await request(app)
      .get('/api/student/peer-groups')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', femaleUserId.toString())
      .query({ 
        language: 'English',
        proficiencyLevel: 'Intermediate',
        culturalPreference: 'iranian' // Iranian-specific filtering
      });

    expect(response.status).toBe(200);
    expect(response.body.groups).toBeDefined();
    expect(Array.isArray(response.body.groups)).toBe(true);
    
    // Should include culturally appropriate groups
    const groupIds = response.body.groups.map((g: any) => g.id);
    expect(groupIds).toContain(mixedGroup.id);
  });
});
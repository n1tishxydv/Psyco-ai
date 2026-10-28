import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';

test('Phase 2: Authentication, Role-Based Access, Patient Intake & Profiles', async (t) => {
  const patientToken = 'Bearer test-token-patient-patient_test_01';
  const psychToken = 'Bearer test-token-psychologist-psych_test_01';

  await t.test('POST /api/v1/profile/onboard/patient should onboard a patient user', async () => {
    const res = await request(app)
      .post('/api/v1/profile/onboard/patient')
      .set('Authorization', patientToken)
      .send({
        fullName: 'Jane Doe',
        gender: 'female',
        age: 29,
        phone: '+1 555-0199',
        preferredName: 'Jane',
        timezone: 'Asia/Kolkata',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'patient');
    assert.equal(res.body.data.profile.fullName, 'Jane Doe');
    assert.equal(res.body.data.profile.age, 29);
  });

  await t.test('GET /api/v1/profile/me should return patient profile and intake status', async () => {
    const res = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', patientToken);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.role, 'patient');
    assert.equal(res.body.data.fullName, 'Jane Doe');
    assert.equal(res.body.data.onboardingStatus, 'completed');
  });

  await t.test('POST /api/v1/intake/draft should save draft intake', async () => {
    const res = await request(app)
      .post('/api/v1/intake/draft')
      .set('Authorization', patientToken)
      .send({
        sectionA: {
          occupation: 'Architect',
          maritalStatus: 'Single',
          emergencyContactName: 'Mark Doe',
          emergencyContactPhone: '+1 555-0123',
          emergencyContactRelationship: 'Brother',
        },
        sectionB: {
          primaryReasons: ['Generalized Anxiety', 'Work & Career Burnout'],
          symptomDuration: '1-6 months',
          severityRating: 6,
          therapyGoals: 'Learn mindfulness coping tools',
        },
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.intake.status, 'draft');
    assert.equal(res.body.data.intake.sectionA.occupation, 'Architect');
  });

  await t.test('POST /api/v1/intake/submit should validate required consents and commit final submission', async () => {
    const fullIntakePayload = {
      sectionA: {
        occupation: 'Architect',
        maritalStatus: 'Single',
        emergencyContactName: 'Mark Doe',
        emergencyContactPhone: '+1 555-0123',
        emergencyContactRelationship: 'Brother',
      },
      sectionB: {
        primaryReasons: ['Generalized Anxiety'],
        symptomDuration: '1-6 months',
        severityRating: 7,
        therapyGoals: 'Overcome anxiety in presentations',
      },
      sectionC: {
        previousTherapy: true,
        previousDiagnoses: 'None',
        currentMedications: 'None',
        familyMentalHealthHistory: 'None',
        medicalConditions: 'None',
      },
      sectionD: {
        sleepQuality: 'fair',
        exerciseFrequency: 'occasional',
        supportSystemRating: 4,
        substanceUseDetails: 'Moderate caffeine',
      },
      sectionE: {
        suicidalIdeationPastMonth: false,
        selfHarmHistory: false,
        immediateRiskAcknowledged: false,
        safetyNotes: 'None',
      },
      sectionF: {
        consentToTreatment: true,
        aiAssistanceAcknowledged: true,
        telehealthConsent: true,
        privacyNoticeAcknowledged: true,
        signatureName: 'Jane Margaret Doe',
      },
    };

    const res = await request(app)
      .post('/api/v1/intake/submit')
      .set('Authorization', patientToken)
      .send(fullIntakePayload);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.intake.status, 'submitted');
    assert.ok(res.body.data.intake.submittedAt);
  });

  await t.test('POST /api/v1/profile/onboard/psychologist should onboard a clinician', async () => {
    const res = await request(app)
      .post('/api/v1/profile/onboard/psychologist')
      .set('Authorization', psychToken)
      .send({
        fullName: 'Dr. Gregory Vance, Ph.D.',
        licenseNumber: 'PSY-884920-CA',
        bio: 'Licensed clinical psychologist specializing in CBT and anxiety disorders.',
        specializations: ['CBT', 'Anxiety', 'Depression'],
        qualifications: ['Ph.D. Clinical Psychology, Stanford'],
        languages: ['English'],
        offeredModes: 'both',
        defaultMode: 'in_person',
        timezone: 'Asia/Kolkata',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'psychologist');
    assert.equal(res.body.data.profile.defaultMode, 'in_person');
  });

  await t.test('PUT /api/v1/intake/template should allow psychologist to configure custom questions', async () => {
    const res = await request(app)
      .put('/api/v1/intake/template')
      .set('Authorization', psychToken)
      .send({
        title: 'Dr. Vance Practice Custom Intake',
        description: 'Practice intake questions for new clients',
        customQuestions: [
          {
            id: 'q1',
            prompt: 'Have you experienced panic attacks in the last two weeks?',
            type: 'boolean',
            required: true,
            order: 0,
          },
        ],
        isActive: true,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.template.title, 'Dr. Vance Practice Custom Intake');
  });

  await t.test('Patient cannot access psychologist template modification endpoint (Role Guard)', async () => {
    const res = await request(app)
      .put('/api/v1/intake/template')
      .set('Authorization', patientToken)
      .send({
        title: 'Unauthorized Attempt',
        customQuestions: [],
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INSUFFICIENT_ROLE_PERMISSIONS');
  });

  await t.test('PUT /api/v1/profile/preferences should update user preferences', async () => {
    const res = await request(app)
      .put('/api/v1/profile/preferences')
      .set('Authorization', patientToken)
      .send({
        theme: 'light',
        language: 'en',
        timezone: 'Asia/Kolkata',
        emailNotifications: false,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.preferences.theme, 'light');
    assert.equal(res.body.data.preferences.emailNotifications, false);
  });
});

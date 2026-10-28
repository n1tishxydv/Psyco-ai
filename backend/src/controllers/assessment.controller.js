import { assessmentService } from '../services/assessment.service.js';
import { z } from 'zod';

const assignAssessmentSchema = z.object({
  patientId: z.string().min(1, 'patientId is required'),
  instrumentId: z.string().min(1, 'instrumentId is required'),
  instructions: z.string().optional(),
  dueDate: z.string().optional(),
});

const submitResponsesSchema = z.object({
  responses: z.record(z.any()),
});

const reviewResultSchema = z.object({
  clinicalInterpretation: z.string().optional(),
  actionTaken: z.string().optional(),
  notes: z.string().optional(),
});

export const assessmentController = {
  getInstruments: async (req, res, next) => {
    try {
      const instruments = assessmentService.getAvailableInstruments();
      res.status(200).json({ success: true, count: instruments.length, instruments });
    } catch (err) {
      next(err);
    }
  },

  getInstrument: async (req, res, next) => {
    try {
      const { instrumentId } = req.params;
      const instrument = assessmentService.getInstrumentDefinition(instrumentId);
      res.status(200).json({ success: true, instrument });
    } catch (err) {
      next(err);
    }
  },

  assignAssessment: async (req, res, next) => {
    try {
      const data = assignAssessmentSchema.parse(req.body);
      const assignment = await assessmentService.assignAssessment(req.user.uid, req.user.role, data);
      res.status(201).json({ success: true, message: 'Assessment assigned to patient.', assignment });
    } catch (err) {
      next(err);
    }
  },

  getAssignment: async (req, res, next) => {
    try {
      const { assignmentId } = req.params;
      const assignment = await assessmentService.getAssignment(assignmentId, req.user.uid, req.user.role);
      res.status(200).json({ success: true, assignment });
    } catch (err) {
      next(err);
    }
  },

  listPatientAssignments: async (req, res, next) => {
    try {
      const { patientId } = req.params;
      const assignments = await assessmentService.listPatientAssignments(patientId, req.user.uid, req.user.role);
      res.status(200).json({ success: true, count: assignments.length, assignments });
    } catch (err) {
      next(err);
    }
  },

  submitResponses: async (req, res, next) => {
    try {
      const { assignmentId } = req.params;
      const data = submitResponsesSchema.parse(req.body);
      const result = await assessmentService.submitResponses(req.user.uid, req.user.role, assignmentId, data.responses);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  getResult: async (req, res, next) => {
    try {
      const { resultId } = req.params;
      const result = await assessmentService.getResult(resultId, req.user.uid, req.user.role);
      res.status(200).json({ success: true, result });
    } catch (err) {
      next(err);
    }
  },

  reviewResult: async (req, res, next) => {
    try {
      const { resultId } = req.params;
      const data = reviewResultSchema.parse(req.body);
      const reviewed = await assessmentService.reviewResult(resultId, req.user.uid, req.user.role, data);
      res.status(200).json({ success: true, message: 'Assessment result reviewed and documented.', result: reviewed });
    } catch (err) {
      next(err);
    }
  },

  getPatientHistory: async (req, res, next) => {
    try {
      const { patientId } = req.params;
      const { instrumentId } = req.query;
      const history = await assessmentService.getPatientHistory(patientId, req.user.uid, req.user.role, instrumentId);
      res.status(200).json({ success: true, count: history.length, history });
    } catch (err) {
      next(err);
    }
  },
};

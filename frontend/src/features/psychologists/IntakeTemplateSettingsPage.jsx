import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { intakeService } from '../../services/intakeService';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Eye,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';

export function IntakeTemplateSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const [template, setTemplate] = useState({
    title: 'Practice Clinical Intake Questionnaire',
    description: 'Please answer these questions prior to your first session with our practice.',
    customQuestions: [],
    isActive: true,
  });

  useEffect(() => {
    async function loadTemplate() {
      try {
        const res = await intakeService.getTemplate();
        if (res?.data?.template) {
          setTemplate(res.data.template);
        }
      } catch (err) {
        console.warn('Could not load existing template:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadTemplate();
  }, []);

  const handleAddQuestion = () => {
    const newQ = {
      id: `q_${Date.now()}`,
      prompt: 'New intake question prompt',
      type: 'text',
      options: ['Option 1', 'Option 2'],
      required: false,
      order: template.customQuestions.length,
    };
    setTemplate({
      ...template,
      customQuestions: [...template.customQuestions, newQ],
    });
  };

  const handleUpdateQuestion = (index, field, value) => {
    const updated = [...template.customQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setTemplate({ ...template, customQuestions: updated });
  };

  const handleDeleteQuestion = (index) => {
    const updated = template.customQuestions.filter((_, i) => i !== index);
    setTemplate({ ...template, customQuestions: updated });
  };

  const handleMoveQuestion = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= template.customQuestions.length) return;

    const list = [...template.customQuestions];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    setTemplate({ ...template, customQuestions: list });
  };

  const handleSave = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSaving(true);

    try {
      await intakeService.updateTemplate(template);
      setSuccessMsg('Intake questionnaire template saved successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save intake template.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[60vh]">
        <LoadingSpinner size="lg" className="text-teal-400 mb-4" />
        <p className="text-sm text-slate-400">Loading custom template builder...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/psychologist/profile" className="text-xs text-teal-400 hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Practice Profile
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-teal-400" />
            Custom Intake Questionnaire Builder
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Design tailored assessment questions that patients will complete when onboarding into your practice.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Edit Questions' : 'Preview Form'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
            Save Template
          </Button>
        </div>
      </div>

      {errorMsg && <AlertBanner type="error" title="Error" message={errorMsg} />}
      {successMsg && <AlertBanner type="success" title="Success" message={successMsg} />}

      {showPreview ? (
        /* Clinician Preview Mode */
        <Card className="border-teal-500/40 bg-slate-900 shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <Badge variant="teal" size="sm" className="mb-2">Patient Preview Mode</Badge>
            <h2 className="text-xl font-bold text-slate-100">{template.title}</h2>
            <p className="text-xs text-slate-400 mt-1">{template.description}</p>
          </div>

          {template.customQuestions.length === 0 ? (
            <p className="text-sm text-slate-500 italic py-6 text-center">
              No custom questions added yet. Switch to edit mode and add your first question.
            </p>
          ) : (
            <div className="space-y-5">
              {template.customQuestions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                    <span>
                      {idx + 1}. {q.prompt} {q.required && <span className="text-red-400">*</span>}
                    </span>
                    <Badge variant="neutral" size="sm" className="capitalize">
                      {q.type}
                    </Badge>
                  </div>

                  {q.type === 'text' && <Input placeholder="Short answer text" disabled />}
                  {q.type === 'textarea' && <Textarea rows={2} placeholder="Longer descriptive response" disabled />}
                  {q.type === 'boolean' && (
                    <div className="flex gap-4 pt-1">
                      <label className="flex items-center gap-2 text-xs text-slate-300">
                        <input type="radio" disabled /> Yes
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-300">
                        <input type="radio" disabled /> No
                      </label>
                    </div>
                  )}
                  {q.type === 'scale' && (
                    <div className="flex items-center justify-between max-w-sm pt-1">
                      <span className="text-[10px] text-slate-400">1: Low</span>
                      <input type="range" min="1" max="10" disabled className="w-48 accent-teal-400" />
                      <span className="text-[10px] text-slate-400">10: High</span>
                    </div>
                  )}
                  {(q.type === 'select' || q.type === 'multiselect') && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(Array.isArray(q.options) ? q.options : (q.options || '').split(',')).map((opt, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs border border-slate-700">
                          {opt.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        /* Edit Builder Mode */
        <div className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/90 shadow-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-teal-300">Template Header Settings</h3>
            <Input
              label="Questionnaire Title"
              value={template.title}
              onChange={(e) => setTemplate({ ...template, title: e.target.value })}
            />
            <Textarea
              label="Introductory Instructions for Patient"
              rows={2}
              value={template.description}
              onChange={(e) => setTemplate({ ...template, description: e.target.value })}
            />
          </Card>

          {/* Question List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">
                Custom Questions ({template.customQuestions.length})
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddQuestion}
                className="flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Question
              </Button>
            </div>

            {template.customQuestions.map((q, idx) => (
              <Card key={q.id} className="border-slate-800 bg-slate-900/90 shadow-md">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <span className="text-xs font-bold text-teal-400">Question #{idx + 1}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={idx === 0}
                        onClick={() => handleMoveQuestion(idx, 'up')}
                        className="p-1 h-7 w-7 text-slate-400"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={idx === template.customQuestions.length - 1}
                        onClick={() => handleMoveQuestion(idx, 'down')}
                        className="p-1 h-7 w-7 text-slate-400"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuestion(idx)}
                        className="p-1 h-7 w-7 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <Input
                        label="Question Prompt"
                        value={q.prompt}
                        onChange={(e) => handleUpdateQuestion(idx, 'prompt', e.target.value)}
                      />
                    </div>
                    <div>
                      <Select
                        label="Response Type"
                        value={q.type}
                        onChange={(e) => handleUpdateQuestion(idx, 'type', e.target.value)}
                        options={[
                          { label: 'Single Line Text', value: 'text' },
                          { label: 'Long Text Area', value: 'textarea' },
                          { label: 'Single Choice Dropdown', value: 'select' },
                          { label: 'Multiple Choice Checkboxes', value: 'multiselect' },
                          { label: 'Yes / No Toggle', value: 'boolean' },
                          { label: 'Rating Scale (1-10)', value: 'scale' },
                        ]}
                      />
                    </div>
                  </div>

                  {(q.type === 'select' || q.type === 'multiselect') && (
                    <Input
                      label="Answer Options (comma separated)"
                      value={Array.isArray(q.options) ? q.options.join(', ') : q.options || ''}
                      onChange={(e) =>
                        handleUpdateQuestion(
                          idx,
                          'options',
                          e.target.value.split(',').map((o) => o.trim())
                        )
                      }
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => handleUpdateQuestion(idx, 'required', e.target.checked)}
                        className="accent-teal-400 rounded"
                      />
                      Make this question required for patients
                    </label>
                  </div>
                </CardContent>
              </Card>
            ))}

            {template.customQuestions.length === 0 && (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 space-y-3">
                <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-300">No Custom Questions Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click below to add questions tailored to your specialty, clinic intake protocol, or symptom assessments.
                </p>
                <Button variant="secondary" size="sm" onClick={handleAddQuestion} className="mt-2">
                  <Plus className="w-4 h-4 mr-1.5" /> Add First Question
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

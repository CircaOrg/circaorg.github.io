import { useState } from 'react';
import {
  FiActivity,
  FiArrowRight,
  FiClock,
  FiPlus,
  FiTrash2,
} from 'react-icons/fi';
import { useFieldStore } from '../lib/socket';
import { useScheduleStore } from '../lib/scheduleStore';
import type { Schedule } from '../lib/scheduleStore';
import './ControlPage.css';

export default function SchedulerPage() {
  const { stations } = useFieldStore();
  const { schedules, removeSchedule, updateSchedule, addSchedule } = useScheduleStore();
  const [showForm, setShowForm] = useState(false);

  const onCreated = (s: Schedule) => {
    addSchedule(s);
    setShowForm(false);
  };

  return (
    <div className="control-page">
      <div className="scheduler">
        <div className="scheduler-header">
          <div>
            <h2 className="ctrl-section-title">Automation Schedules</h2>
            <p className="ctrl-section-sub">If-This-Then-That rules for automatic irrigation</p>
          </div>
          <button id="add-schedule-btn" className="btn-primary" onClick={() => setShowForm(true)}>
            <FiPlus aria-hidden="true" />
            <span>New Rule</span>
          </button>
        </div>

        {schedules.length === 0 && !showForm && (
          <div className="ctrl-empty card">
            <p>No automation rules yet.</p>
            <p style={{ color: 'var(--gray-mid)', fontSize: 13 }}>
              Create a rule to automate your turret based on sensor conditions or a time schedule.
            </p>
          </div>
        )}

        <div className="schedule-list">
          {schedules.map((s) => (
            <ScheduleCard
              key={s.id}
              schedule={s}
              onDelete={(id) => removeSchedule(id)}
              onToggle={(id, enabled) => updateSchedule(id, { enabled })}
            />
          ))}
        </div>

        {showForm && (
          <ScheduleForm
            stations={stations}
            onCancel={() => setShowForm(false)}
            onCreated={onCreated}
          />
        )}
      </div>
    </div>
  );
}

function ScheduleCard({ schedule, onDelete, onToggle }: {
  schedule: Schedule;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const triggerLabel = schedule.trigger.type === 'time'
    ? (
      <>
        <FiClock aria-hidden="true" />
        <span>{schedule.trigger.cron}</span>
      </>
    )
    : (
      <>
        <FiActivity aria-hidden="true" />
        <span>{schedule.trigger.metric} {schedule.trigger.operator} {schedule.trigger.threshold}%</span>
      </>
    );

  const actionLabel = schedule.actions.map((a) =>
    a.type === 'fire_turret' ? `Fire turret @ ${a.angle}° for ${a.duration}s` : a.type
  ).join(', ');

  return (
    <div className={`schedule-card card ${!schedule.enabled ? 'disabled' : ''}`}>
      <div className="schedule-card-left">
        <div className="schedule-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={schedule.enabled}
              onChange={(e) => onToggle(schedule.id, e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>
        <div>
          <p className="schedule-name">{schedule.name}</p>
          <p className="schedule-trigger">{triggerLabel}</p>
          <p className="schedule-action"><FiArrowRight aria-hidden="true" /><span>{actionLabel}</span></p>
        </div>
      </div>
      <button className="schedule-delete" onClick={() => onDelete(schedule.id)} title="Delete">
        <FiTrash2 aria-hidden="true" />
      </button>
    </div>
  );
}

function ScheduleForm({ stations, onCancel, onCreated }: {
  stations: any[];
  onCancel: () => void;
  onCreated: (s: Schedule) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    station_id: stations[0]?.id || '',
    trigger_type: 'condition',
    metric: 'soil_moisture',
    operator: '<',
    threshold: 30,
    cron: '0 6 * * *',
    angle: 90,
    duration: 10,
  });
  const [saving, setSaving] = useState(false);
  const upd = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    setSaving(true);
    const body = {
      name: form.name,
      station_id: form.station_id,
      trigger: form.trigger_type === 'condition'
        ? { type: 'condition', metric: form.metric, operator: form.operator, threshold: form.threshold }
        : { type: 'time', cron: form.cron },
      conditions: [],
      actions: [{ type: 'fire_turret', angle: form.angle, duration: form.duration }],
      enabled: true,
    };
    onCreated(body as any);
    setSaving(false);
  };

  return (
    <div className="schedule-form card">
      <h3 className="form-title">New Automation Rule</h3>

      <div className="form-row">
        <label className="label">Rule Name</label>
        <input className="input" placeholder="e.g. Morning irrigation" value={form.name} onChange={(e) => upd('name', e.target.value)} />
      </div>

      <div className="form-row">
        <label className="label">Base Station</label>
        <select className="input" value={form.station_id} onChange={(e) => upd('station_id', e.target.value)}>
          {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          {stations.length === 0 && <option value="">No stations — add one from Configure first</option>}
        </select>
      </div>

      <div className="form-row-split">
        <div>
          <label className="label">Trigger Type</label>
          <select className="input" value={form.trigger_type} onChange={(e) => upd('trigger_type', e.target.value)}>
            <option value="condition">Sensor Condition</option>
            <option value="time">Time (Cron)</option>
          </select>
        </div>

        {form.trigger_type === 'condition' ? (
          <>
            <div>
              <label className="label">Metric</label>
              <select className="input" value={form.metric} onChange={(e) => upd('metric', e.target.value)}>
                <option value="soil_moisture">Soil Moisture</option>
                <option value="humidity">Humidity</option>
                <option value="temperature">Temperature</option>
              </select>
            </div>
            <div>
              <label className="label">Operator</label>
              <select className="input" value={form.operator} onChange={(e) => upd('operator', e.target.value)}>
                <option value="<">below (&lt;)</option>
                <option value=">">above (&gt;)</option>
              </select>
            </div>
            <div>
              <label className="label">Threshold (%)</label>
              <input className="input" type="number" value={form.threshold} onChange={(e) => upd('threshold', parseInt(e.target.value))} />
            </div>
          </>
        ) : (
          <div>
            <label className="label">Cron Expression</label>
            <input className="input mono" placeholder="0 6 * * *" value={form.cron} onChange={(e) => upd('cron', e.target.value)} />
          </div>
        )}
      </div>

      <div className="form-section-title">Action: Fire Turret</div>
      <div className="form-row-split">
        <div>
          <label className="label">Angle (0–180°)</label>
          <input className="input" type="number" min="0" max="180" value={form.angle} onChange={(e) => upd('angle', parseInt(e.target.value))} />
        </div>
        <div>
          <label className="label">Duration (s)</label>
          <input className="input" type="number" min="1" value={form.duration} onChange={(e) => upd('duration', parseInt(e.target.value))} />
        </div>
      </div>

      <div className="form-actions">
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" disabled={!form.name || saving} onClick={handleSave}>
          {saving ? <span className="spinner" /> : 'Save Rule'}
        </button>
      </div>
    </div>
  );
}

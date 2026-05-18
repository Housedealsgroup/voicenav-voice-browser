import {
  createTask, submitTask, getActiveTask, advanceStep, cancelActiveTask,
  pauseActiveTask, resumeActiveTask, getTaskProgress, hasMultipleSteps,
  parseMultiStepCommand, matchTaskTemplate, createTaskFromTemplate,
  completeActiveTask, TASK_TEMPLATES,
} from '../taskEngine';

describe('Task Engine', () => {
  beforeEach(() => {
    cancelActiveTask();
  });

  describe('hasMultipleSteps()', () => {
    it('detects "then" separator', () => {
      expect(hasMultipleSteps('search for headphones then click the first')).toBe(true);
    });

    it('detects "and then" separator', () => {
      expect(hasMultipleSteps('go to amazon and then search')).toBe(true);
    });

    it('detects semicolon separator', () => {
      expect(hasMultipleSteps('go to amazon; search for headphones')).toBe(true);
    });

    it('returns false for single command', () => {
      expect(hasMultipleSteps('go to amazon')).toBe(false);
    });
  });

  describe('parseMultiStepCommand()', () => {
    it('splits on "then"', () => {
      const steps = parseMultiStepCommand('search for headphones then click the first');
      expect(steps.length).toBe(2);
      expect(steps[0]).toContain('search');
      expect(steps[1]).toContain('click');
    });

    it('splits on semicolons', () => {
      const steps = parseMultiStepCommand('go to amazon; search; click');
      expect(steps.length).toBe(3);
    });

    it('returns single element for no separator', () => {
      const steps = parseMultiStepCommand('go to amazon');
      expect(steps.length).toBe(1);
    });
  });

  describe('matchTaskTemplate()', () => {
    it('matches shopping template', () => {
      const template = matchTaskTemplate('shop for headphones on amazon');
      expect(template).not.toBeNull();
      expect(template?.name).toContain('Shop');
    });

    it('matches email template', () => {
      const template = matchTaskTemplate('check my email');
      expect(template).not.toBeNull();
    });

    it('matches news template', () => {
      const template = matchTaskTemplate('read news');
      expect(template).not.toBeNull();
    });

    it('returns null for no match', () => {
      const template = matchTaskTemplate('asdfghjkl');
      expect(template).toBeNull();
    });
  });

  describe('createTaskFromTemplate()', () => {
    it('interpolates variables', () => {
      const template = TASK_TEMPLATES[0]; // Shop template
      const task = createTaskFromTemplate(template, { item: 'headphones' });
      expect(task.name).toBeDefined();
      expect(task.steps.length).toBeGreaterThan(0);
    });
  });

  describe('Task lifecycle', () => {
    it('creates and submits task', () => {
      const task = createTask('Test Task', [
        { name: 'Step 1', command: 'go to amazon' },
        { name: 'Step 2', command: 'search headphones' },
      ]);
      submitTask(task);
      const active = getActiveTask();
      expect(active).not.toBeNull();
      expect(active?.name).toBe('Test Task');
    });

    it('advances through steps', () => {
      const task = createTask('Test', [
        { name: 'Step 1', command: 'a' },
        { name: 'Step 2', command: 'b' },
      ]);
      submitTask(task);
      advanceStep();
      const active = getActiveTask();
      expect(active?.currentStepIndex).toBe(1);
    });

    it('cancels task', () => {
      const task = createTask('Test', [{ name: 'Step 1', command: 'a' }]);
      submitTask(task);
      cancelActiveTask();
      expect(getActiveTask()).toBeNull();
    });

    it('pauses and resumes task', () => {
      const task = createTask('Test', [{ name: 'Step 1', command: 'a' }]);
      submitTask(task);
      pauseActiveTask();
      expect(getActiveTask()?.status).toBe('paused');
      resumeActiveTask();
      expect(getActiveTask()?.status).toBe('running');
    });

    it('gets task progress', () => {
      const task = createTask('Test', [
        { name: 'Step 1', command: 'a' },
        { name: 'Step 2', command: 'b' },
        { name: 'Step 3', command: 'c' },
      ]);
      submitTask(task);
      const progress = getTaskProgress();
      expect(progress).not.toBeNull();
      expect(progress?.total).toBe(3);
    });
  });
});

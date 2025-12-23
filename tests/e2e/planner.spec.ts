import { test, expect } from '@playwright/test';

test.describe('Planner E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage before each test
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
  });

  test('should load the planner page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Planner');
    await expect(page.locator('text=What should I work on today?')).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    // Click new task button
    await page.click('button:has-text("+ New Task")');
    
    // Fill out the form
    await page.fill('input[placeholder="What do you need to do?"]', 'Test Homework Task');
    await page.click('button:has-text("📚 Homework")');
    await page.fill('input[placeholder="e.g., Math, Computer Science, Personal"]', 'Computer Science');
    
    // Submit the form
    await page.click('button:has-text("Create Task")');
    
    // Verify task appears
    await expect(page.locator('text=Test Homework Task')).toBeVisible();
    await expect(page.locator('text=Computer Science')).toBeVisible();
  });

  test('should complete a task', async ({ page }) => {
    // Create a task first
    await page.click('button:has-text("+ New Task")');
    await page.fill('input[placeholder="What do you need to do?"]', 'Task to Complete');
    await page.click('button:has-text("Create Task")');
    
    // Complete the task
    await page.click('button[aria-label="Complete task"]');
    
    // Verify task is marked as completed (should have line-through)
    const taskTitle = page.locator('text=Task to Complete');
    await expect(taskTitle).toHaveClass(/line-through/);
  });

  test('should undo task creation', async ({ page }) => {
    // Create a task
    await page.click('button:has-text("+ New Task")');
    await page.fill('input[placeholder="What do you need to do?"]', 'Task to Undo');
    await page.click('button:has-text("Create Task")');
    
    // Verify task exists
    await expect(page.locator('text=Task to Undo')).toBeVisible();
    
    // Undo
    await page.click('button:has-text("↶ Undo")');
    
    // Verify task is gone
    await expect(page.locator('text=Task to Undo')).not.toBeVisible();
  });

  test('should delete a task', async ({ page }) => {
    // Create a task
    await page.click('button:has-text("+ New Task")');
    await page.fill('input[placeholder="What do you need to do?"]', 'Task to Delete');
    await page.click('button:has-text("Create Task")');
    
    // Delete the task
    await page.click('button[title="Delete task"]');
    
    // Verify task is gone
    await expect(page.locator('text=Task to Delete')).not.toBeVisible();
  });

  test('should persist tasks after reload', async ({ page }) => {
    // Create a task
    await page.click('button:has-text("+ New Task")');
    await page.fill('input[placeholder="What do you need to do?"]', 'Persistent Task');
    await page.click('button:has-text("Create Task")');
    
    // Reload the page
    await page.reload();
    
    // Verify task still exists
    await expect(page.locator('text=Persistent Task')).toBeVisible();
  });

  test('should open quick add with keyboard shortcut', async ({ page }) => {
    // Press 'N' key
    await page.keyboard.press('n');
    
    // Verify modal is open
    await expect(page.locator('h2:has-text("New Task")')).toBeVisible();
  });

  test('should close modal with Escape', async ({ page }) => {
    // Open modal
    await page.click('button:has-text("+ New Task")');
    await expect(page.locator('h2:has-text("New Task")')).toBeVisible();
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Verify modal is closed
    await expect(page.locator('h2:has-text("New Task")')).not.toBeVisible();
  });

  test('should create task with due date', async ({ page }) => {
    // Open modal
    await page.click('button:has-text("+ New Task")');
    
    // Fill form with due date
    await page.fill('input[placeholder="What do you need to do?"]', 'Task with Due Date');
    await page.fill('input[type="date"]', '2099-12-31');
    
    // Submit
    await page.click('button:has-text("Create Task")');
    
    // Verify task appears
    await expect(page.locator('text=Task with Due Date')).toBeVisible();
  });

  test('should start pomodoro timer', async ({ page }) => {
    // Create a task
    await page.click('button:has-text("+ New Task")');
    await page.fill('input[placeholder="What do you need to do?"]', 'Pomodoro Task');
    await page.click('button:has-text("Create Task")');
    
    // Click pomodoro button
    await page.click('button[title="Start Pomodoro"]');
    
    // Verify timer is visible
    await expect(page.locator('h2:has-text("🍅 Focus Time")')).toBeVisible();
    await expect(page.locator('text=25:00')).toBeVisible();
  });
});

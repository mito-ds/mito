import { expect, test } from '@jupyterlab/galata';

test.describe.configure({ mode: 'parallel' });

test.describe('Notebook Tests', () => {
  test('Render a variable', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a different variable', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a different varia1ble', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a d1ifferent variable', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a diffe123rent variable', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a different123 variable', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('123Render a different variable', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a different va123riable', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a different variabqweqwelasdae', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a different vwlrgkweariablasdae', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a diffqweqweerent variablasdae', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a diffqweqeerent variablasdae', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a diffeddddent var1111iablasdae', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a diffyyyyerent variablasdae', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a diffeaaarent variablasdae', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a differsssent variablasdae', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a diffeddddent variablasdae', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a differenffft variablasdae', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a different v12313ariablasdae', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a dif77ferent variablasdae', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a diffe66rent variablasdae', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a differe55nt variablasdae', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a different 34variablasdae', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
  test('Render a diffe12rent variablasdae', async ({ page, tmpPath }) => {
    const fileName = 'create_test.ipynb';
    await page.notebook.createNew(fileName);
    await page.notebook.setCell(0, 'code', 'x = 1; x')
    await page.notebook.runCell(0);
    const cellOuput = await page.notebook.getCellOutput(0)
    expect(await cellOuput?.innerHTML()).toContain('1');
  });
});
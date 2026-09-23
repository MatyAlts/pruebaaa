import { createNativeOcr } from '../src/native-ocr';

const id = '8c68d16e-bfad-444e-823d-232efad33a2d';
test('extracts a protected local attachment and validates native text/page result', async () => {
  const module = { extractText: jest.fn().mockResolvedValue({ text: 'Documento ficticio', pages: 2 }), cancelExtraction: jest.fn() };
  const adapter = createNativeOcr(() => module);
  await expect(adapter.extract('file:///cache/misaluteca-uploads/test.pdf', id)).resolves.toEqual({ text: 'Documento ficticio', pages: 2 });
  expect(module.extractText).toHaveBeenCalledWith('file:///cache/misaluteca-uploads/test.pdf', id);
});
test('rejects remote input before invoking native code', async () => {
  const module = { extractText: jest.fn(), cancelExtraction: jest.fn() };
  await expect(createNativeOcr(() => module).extract('https://example.test/test.pdf', id)).rejects.toThrow();
  expect(module.extractText).not.toHaveBeenCalled();
});
test('cancel suppresses even a late native success for the same request', async () => {
  let resolve!: (value: unknown) => void;
  const module = { extractText: jest.fn(() => new Promise(resolvePromise => { resolve = resolvePromise; })), cancelExtraction: jest.fn().mockResolvedValue(undefined) };
  const adapter = createNativeOcr(() => module);
  const pending = adapter.extract('file:///cache/misaluteca-uploads/test.png', id);
  await adapter.cancel(id);
  resolve({ text: 'Documento ficticio', pages: 1 });
  await expect(pending).rejects.toThrow('cancelada');
  expect(module.cancelExtraction).toHaveBeenCalledWith(id);
});
test.each([{ name: 'empty', text: '', pages: 1 }, { name: 'oversized text', text: 'x'.repeat(20001), pages: 1 }, { name: 'too many pages', text: 'texto', pages: 21 }])('rejects invalid bounded native result $name', async result => {
  const module = { extractText: jest.fn().mockResolvedValue(result), cancelExtraction: jest.fn() };
  await expect(createNativeOcr(() => module).extract('file:///cache/misaluteca-uploads/test.pdf', id)).rejects.toThrow();
});
test('unavailable native build gives useful error and never starts work', async () => {
  await expect(createNativeOcr(() => null).extract('file:///cache/misaluteca-uploads/test.pdf', id)).rejects.toThrow('no está disponible');
});
test('logout cleanup cancels all active requests and suppresses their late results', async () => {
  let resolve!: (value: unknown) => void;
  const module = { extractText: jest.fn(() => new Promise(done => { resolve = done; })), cancelExtraction: jest.fn().mockResolvedValue(undefined) };
  const adapter = createNativeOcr(() => module);
  const pending = adapter.extract('file:///cache/misaluteca-uploads/test.pdf', id);
  await adapter.clear();
  expect(module.cancelExtraction).toHaveBeenCalledWith(id);
  resolve({ text: 'Documento ficticio', pages: 1 });
  await expect(pending).rejects.toThrow('cancelada');
});

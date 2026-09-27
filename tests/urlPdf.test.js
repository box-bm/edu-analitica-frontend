import { describe, expect, it } from 'vitest';
import { MAX_URL_PDF, esUrlPdfValida } from '../src/utils/urlPdf';

describe('esUrlPdfValida', () => {
  it('accepts http(s) links, Drive or not', () => {
    expect(esUrlPdfValida('https://drive.google.com/file/d/abc/view?usp=sharing')).toBe(true);
    expect(esUrlPdfValida('http://ejemplo.com/reporte.pdf')).toBe(true);
    expect(esUrlPdfValida('  https://ejemplo.com/x.pdf  ')).toBe(true);
  });

  it('rejects plain text, empty input and non-http schemes', () => {
    expect(esUrlPdfValida('')).toBe(false);
    expect(esUrlPdfValida('reporte final')).toBe(false);
    expect(esUrlPdfValida('drive.google.com/file/d/abc')).toBe(false);
    expect(esUrlPdfValida('javascript:alert(1)')).toBe(false);
    expect(esUrlPdfValida('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(esUrlPdfValida('ftp://ejemplo.com/x.pdf')).toBe(false);
  });

  it('rejects links longer than the column allows', () => {
    const base = 'https://ejemplo.com/';
    expect(esUrlPdfValida(base + 'a'.repeat(MAX_URL_PDF - base.length))).toBe(true);
    expect(esUrlPdfValida(base + 'a'.repeat(MAX_URL_PDF - base.length + 1))).toBe(false);
  });
});

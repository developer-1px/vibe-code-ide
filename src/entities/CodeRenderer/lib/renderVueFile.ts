/**
 * Vue SFC 파일 렌더링
 * <script>, <template>, <style> 섹션을 각각 다르게 처리
 */

import * as ts from 'typescript';
import type { CanvasNode } from '../../CanvasNode';
import type { CodeLine } from '../model/types';
import { parse } from '@vue/compiler-sfc';
import { renderCodeLines } from './renderCodeLines';

/**
 * Vue 파일의 섹션 정보
 */
interface VueSection {
  type: 'script' | 'template' | 'style';
  content: string;
  startLine: number;
  endLine: number;
  lang?: string;
}

/**
 * Vue SFC를 파싱하여 섹션별로 분리
 */
function parseVueSections(vueContent: string, filePath: string): VueSection[] {
  const sections: VueSection[] = [];
  const lines = vueContent.split('\n');

  try {
    const { descriptor } = parse(vueContent, { filename: filePath });

    // Script 섹션 (script setup 또는 script)
    const script = descriptor.scriptSetup || descriptor.script;
    if (script) {
      const scriptStartLine = vueContent.substring(0, script.loc.start.offset).split('\n').length;
      const scriptEndLine = vueContent.substring(0, script.loc.end.offset).split('\n').length;

      sections.push({
        type: 'script',
        content: script.content,
        startLine: scriptStartLine,
        endLine: scriptEndLine,
        lang: script.lang || 'js'
      });
    }

    // Template 섹션
    if (descriptor.template) {
      const template = descriptor.template;
      const templateStartLine = vueContent.substring(0, template.loc.start.offset).split('\n').length;
      const templateEndLine = vueContent.substring(0, template.loc.end.offset).split('\n').length;

      sections.push({
        type: 'template',
        content: template.content,
        startLine: templateStartLine,
        endLine: templateEndLine,
        lang: template.lang || 'html'
      });
    }

    // Style 섹션 (여러 개 가능)
    descriptor.styles.forEach(style => {
      const styleStartLine = vueContent.substring(0, style.loc.start.offset).split('\n').length;
      const styleEndLine = vueContent.substring(0, style.loc.end.offset).split('\n').length;

      sections.push({
        type: 'style',
        content: style.content,
        startLine: styleStartLine,
        endLine: styleEndLine,
        lang: style.lang || 'css'
      });
    });

  } catch (error) {
    console.error(`❌ Error parsing Vue file ${filePath}:`, error);
  }

  return sections;
}

/**
 * Script 섹션 렌더링 (TypeScript AST 사용)
 */
function renderScriptSection(
  section: VueSection,
  node: CanvasNode,
  files: Record<string, string>
): CodeLine[] {
  // Script 내용으로 임시 SourceFile 생성
  const scriptSource = ts.createSourceFile(
    node.filePath + '.ts',
    section.content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  // CanvasNode를 Script 내용으로 임시 수정하여 renderCodeLines 호출
  const tempNode: CanvasNode = {
    ...node,
    codeSnippet: section.content,
    startLine: section.startLine,
    sourceFile: scriptSource
  };

  return renderCodeLines(tempNode, files);
}

/**
 * Template 섹션 렌더링 (plain text로 출력)
 */
function renderTemplateSection(section: VueSection): CodeLine[] {
  const lines = section.content.split('\n');

  return lines.map((lineText, idx) => ({
    num: section.startLine + idx,
    segments: [{
      text: lineText,
      kinds: ['text']
    }],
    hasInput: false
  }));
}

/**
 * Style 섹션 렌더링 (plain text로 출력)
 */
function renderStyleSection(section: VueSection): CodeLine[] {
  const lines = section.content.split('\n');

  return lines.map((lineText, idx) => ({
    num: section.startLine + idx,
    segments: [{
      text: lineText,
      kinds: ['text']
    }],
    hasInput: false
  }));
}

/**
 * 섹션 태그 라인 렌더링 (예: <script setup lang="ts">, </script>)
 */
function renderSectionTags(vueContent: string, section: VueSection): CodeLine[] {
  const lines = vueContent.split('\n');
  const result: CodeLine[] = [];

  // Opening tag line
  const openingLine = lines[section.startLine - 2]; // -2 because startLine is 1-indexed and points to content
  if (openingLine) {
    result.push({
      num: section.startLine - 1,
      segments: [{
        text: openingLine,
        kinds: ['text']
      }],
      hasInput: false
    });
  }

  return result;
}

/**
 * Vue 파일 전체 렌더링
 * 각 섹션을 개별적으로 파싱하되, 전체 파일의 라인 번호를 유지
 */
export function renderVueFile(node: CanvasNode, files: Record<string, string>): CodeLine[] {
  const vueContent = node.codeSnippet;
  const filePath = node.filePath;
  const vueLines = vueContent.split('\n');

  // Vue 섹션 파싱
  const sections = parseVueSections(vueContent, filePath);

  if (sections.length === 0) {
    // Fallback: plain text로 렌더링
    return vueLines.map((lineText, idx) => ({
      num: (node.startLine || 1) + idx,
      segments: [{ text: lineText, kinds: ['text'] }],
      hasInput: false
    }));
  }

  const allLines: CodeLine[] = [];
  let currentLine = 1;

  sections.forEach((section) => {
    // 섹션 시작 전의 라인들 (opening tag 전까지)
    while (currentLine < section.startLine) {
      const lineText = vueLines[currentLine - 1] || '';
      allLines.push({
        num: currentLine,
        segments: [{ text: lineText, kinds: ['text'] }],
        hasInput: false
      });
      currentLine++;
    }

    // 섹션 내용 렌더링
    let sectionLines: CodeLine[];

    if (section.type === 'script') {
      sectionLines = renderScriptSection(section, node, files);
    } else if (section.type === 'template') {
      sectionLines = renderTemplateSection(section);
    } else {
      sectionLines = renderStyleSection(section);
    }

    allLines.push(...sectionLines);
    currentLine = section.endLine;
  });

  // 마지막 섹션 이후의 라인들 (closing tag 등)
  while (currentLine <= vueLines.length) {
    const lineText = vueLines[currentLine - 1] || '';
    allLines.push({
      num: currentLine,
      segments: [{ text: lineText, kinds: ['text'] }],
      hasInput: false
    });
    currentLine++;
  }

  return allLines;
}

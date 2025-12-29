/**
 * Vue SFC 파일 렌더링
 * <script>, <template>, <style> 섹션을 각각 다르게 처리
 */

import * as ts from 'typescript';
import type { CanvasNode } from '../../CanvasNode';
import type { CodeLine, CodeSegment } from '../model/types';
import { parse, compileTemplate } from '@vue/compiler-sfc';
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
 * loc.start.line과 loc.end.line을 사용하여 정확한 라인 번호 추출
 */
function parseVueSections(vueContent: string, filePath: string): VueSection[] {
  const sections: VueSection[] = [];

  try {
    const { descriptor } = parse(vueContent, { filename: filePath });

    // Template 섹션 (파일 순서대로 정렬하기 위해 먼저 처리)
    if (descriptor.template) {
      const template = descriptor.template;

      sections.push({
        type: 'template',
        content: template.content,
        startLine: template.loc.start.line, // content 시작 라인
        endLine: template.loc.end.line,     // content 끝 라인
        lang: template.lang || 'html'
      });
    }

    // Script 섹션 (script setup 또는 script)
    const script = descriptor.scriptSetup || descriptor.script;
    if (script) {
      sections.push({
        type: 'script',
        content: script.content,
        startLine: script.loc.start.line,
        endLine: script.loc.end.line,
        lang: script.lang || 'js'
      });
    }

    // Style 섹션 (여러 개 가능)
    descriptor.styles.forEach(style => {
      sections.push({
        type: 'style',
        content: style.content,
        startLine: style.loc.start.line,
        endLine: style.loc.end.line,
        lang: style.lang || 'css'
      });
    });

    // 파일 순서대로 정렬
    sections.sort((a, b) => a.startLine - b.startLine);

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
 * Template 섹션 렌더링 (Vue template AST 기반 segment 생성)
 */
function renderTemplateSection(section: VueSection, vueContent: string, filePath: string): CodeLine[] {
  const lines = section.content.split('\n');

  try {
    // Vue template AST 파싱
    const { descriptor } = parse(vueContent, { filename: filePath });

    if (!descriptor.template) {
      return lines.map((lineText, idx) => ({
        num: section.startLine + idx,
        segments: [{ text: lineText, kinds: ['text'] }],
        hasInput: false
      }));
    }

    // Template AST를 사용하여 segment 생성
    const result: CodeLine[] = lines.map((lineText, idx) => ({
      num: section.startLine + idx,
      segments: parseTemplateLine(lineText),
      hasInput: false
    }));

    return result;

  } catch (error) {
    console.error('❌ Error parsing template:', error);
    // Fallback: plain text
    return lines.map((lineText, idx) => ({
      num: section.startLine + idx,
      segments: [{ text: lineText, kinds: ['text'] }],
      hasInput: false
    }));
  }
}

/**
 * Template 라인을 segment로 파싱
 * 간단한 정규식 기반 파싱 (태그, 속성, mustache 표현식)
 */
function parseTemplateLine(lineText: string): CodeSegment[] {
  const segments: CodeSegment[] = [];
  let currentPos = 0;

  // 정규식 패턴들
  const tagOpenPattern = /<(\w+)/g;  // Opening tag
  const tagClosePattern = /<\/(\w+)>/g;  // Closing tag
  const attrPattern = /(\w+)="([^"]*)"/g;  // Attributes
  const mustachePattern = /\{\{([^}]+)\}\}/g;  // {{ expression }}

  // 간단한 파싱: 전체 라인을 텍스트로 처리하되, 특정 패턴만 하이라이트
  // 더 정교한 파싱을 위해서는 Vue template compiler의 AST를 순회해야 함

  // 일단 전체를 text로 반환 (향후 개선 예정)
  if (lineText.trim() === '') {
    segments.push({ text: lineText, kinds: ['text'] });
  } else {
    segments.push({ text: lineText, kinds: ['text'] });
  }

  return segments;
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
 * 섹션별로 다른 파서 사용 + 태그 라인 하이라이팅
 */
export function renderVueFile(node: CanvasNode, files: Record<string, string>): CodeLine[] {
  const vueContent = node.codeSnippet;
  const filePath = node.filePath;
  const vueLines = vueContent.split('\n');

  // 먼저 전체를 plain text로 렌더링
  const allLines: CodeLine[] = vueLines.map((lineText, idx) => ({
    num: idx + 1,
    segments: [{ text: lineText, kinds: ['text'] }],
    hasInput: false
  }));

  // Vue 섹션 파싱
  const sections = parseVueSections(vueContent, filePath);

  // 각 섹션 처리
  sections.forEach(section => {
    // 섹션 opening tag 찾기 (content 시작 라인 이전)
    const openingTagLineNum = section.startLine - 1;
    if (openingTagLineNum > 0 && openingTagLineNum <= vueLines.length) {
      const openingTagText = vueLines[openingTagLineNum - 1];

      // Opening tag를 keyword로 하이라이팅
      allLines[openingTagLineNum - 1] = {
        num: openingTagLineNum,
        segments: renderSectionTag(openingTagText, section.type),
        hasInput: false
      };
    }

    // 섹션 closing tag 찾기 (content 끝 라인 이후)
    const closingTagLineNum = section.endLine + 1;
    if (closingTagLineNum > 0 && closingTagLineNum <= vueLines.length) {
      const closingTagText = vueLines[closingTagLineNum - 1];

      // Closing tag를 keyword로 하이라이팅
      allLines[closingTagLineNum - 1] = {
        num: closingTagLineNum,
        segments: renderSectionTag(closingTagText, section.type),
        hasInput: false
      };
    }

    // 섹션 내용 렌더링
    if (section.type === 'script') {
      const scriptLines = renderScriptSection(section, node, files);

      // Script 섹션의 라인들만 교체
      scriptLines.forEach(line => {
        const lineIdx = line.num - 1;
        if (lineIdx >= 0 && lineIdx < allLines.length) {
          allLines[lineIdx] = line;
        }
      });
    } else if (section.type === 'template') {
      const templateLines = renderTemplateSection(section, vueContent, filePath);

      // Template 섹션의 라인들만 교체
      templateLines.forEach(line => {
        const lineIdx = line.num - 1;
        if (lineIdx >= 0 && lineIdx < allLines.length) {
          allLines[lineIdx] = line;
        }
      });
    }
  });

  return allLines;
}

/**
 * 섹션 태그 렌더링 (<template>, <script>, <style> 태그 하이라이팅)
 */
function renderSectionTag(tagText: string, sectionType: 'script' | 'template' | 'style'): CodeSegment[] {
  // 간단한 파싱: < > 사이의 내용을 keyword로 표시
  const segments: CodeSegment[] = [];

  // 공백 처리
  const leadingSpaceMatch = tagText.match(/^(\s*)/);
  if (leadingSpaceMatch && leadingSpaceMatch[1].length > 0) {
    segments.push({ text: leadingSpaceMatch[1], kinds: ['text'] });
  }

  const trimmed = tagText.trim();

  if (trimmed.startsWith('</')) {
    // Closing tag: </template>, </script>, </style>
    segments.push({ text: '</', kinds: ['punctuation'] });
    segments.push({ text: sectionType, kinds: ['keyword'] });
    segments.push({ text: '>', kinds: ['punctuation'] });
  } else if (trimmed.startsWith('<')) {
    // Opening tag: <template>, <script setup lang="ts">, etc.
    segments.push({ text: '<', kinds: ['punctuation'] });

    // Tag name
    const tagMatch = trimmed.match(/<(\w+)(.*)>$/);
    if (tagMatch) {
      segments.push({ text: tagMatch[1], kinds: ['keyword'] });

      // Attributes
      if (tagMatch[2].trim()) {
        segments.push({ text: tagMatch[2], kinds: ['text'] });
      }

      segments.push({ text: '>', kinds: ['punctuation'] });
    } else {
      // Fallback
      segments.push({ text: trimmed.substring(1), kinds: ['text'] });
    }
  } else {
    segments.push({ text: tagText, kinds: ['text'] });
  }

  return segments;
}

# react-hotkeys-hook 학습 정리

## 핵심 개념

### 1. useHotkeys Signature

```typescript
function useHotkeys<T extends Element>(
  keys: string | string[],
  callback: (event: KeyboardEvent, handler: HotkeysEvent) => void,
  options: Options = {},
  deps: any[] = []
): React.MutableRef<T | null>
```

**중요**: 4개의 파라미터를 받으며, options와 deps는 별도의 파라미터입니다.

### 2. Scopes 작동 방식

#### 기본 동작
- **모든 hotkey는 기본적으로 `*` (wildcard) scope에 속함**
- `HotkeysProvider`를 사용하지 않으면 모든 hotkey가 항상 활성화됨
- `HotkeysProvider`에서 `initiallyActiveScopes`를 지정하지 않으면 wildcard scope만 활성화됨

#### 중요한 함정 🚨
**`initiallyActiveScopes`를 설정하면 wildcard scope가 자동으로 비활성화됨!**

```javascript
// ❌ 잘못된 예 - wildcard scope가 비활성화됨
<HotkeysProvider initiallyActiveScopes={['sidebar']}>
  {/* '*' scope의 hotkey들이 작동 안 함! */}
</HotkeysProvider>

// ✅ 올바른 예 - wildcard와 sidebar 모두 활성화
<HotkeysProvider initiallyActiveScopes={['*', 'sidebar']}>
  {/* 모든 scope의 hotkey가 작동 */}
</HotkeysProvider>
```

### 3. Scope 사용 패턴

#### 패턴 1: 전역 단축키 (wildcard scope)
```typescript
// scopes 옵션을 지정하지 않으면 자동으로 '*' scope
useHotkeys('cmd+k', callback, { enableOnFormTags: true })

// 또는 명시적으로 지정
useHotkeys('cmd+k', callback, {
  scopes: ['*'],
  enableOnFormTags: true
})
```

#### 패턴 2: 특정 scope의 단축키
```typescript
// 'sidebar' scope에만 속함 (wildcard에 속하지 않음)
useHotkeys('down', callback, {
  scopes: ['sidebar'],
  enabled: focusedPane === 'sidebar'
})
```

#### 패턴 3: 동적 scope 활성화
```typescript
const { enableScope, disableScope, toggleScope } = useHotkeysContext()

useEffect(() => {
  if (isModalOpen) {
    enableScope('modal')
  } else {
    disableScope('modal')
  }
}, [isModalOpen, enableScope, disableScope])
```

### 4. 의존성 배열 (deps)

**callback 내부에서 사용하는 값은 반드시 deps 배열에 포함해야 함**

```typescript
// ❌ 잘못된 예 - stale closure 발생
useHotkeys('down', () => {
  setIndex(prev => Math.min(prev + 1, results.length - 1))
}, { scopes: ['search'] })
// results.length가 변경되어도 callback이 업데이트 안 됨!

// ✅ 올바른 예
useHotkeys('down', () => {
  setIndex(prev => Math.min(prev + 1, results.length - 1))
}, { scopes: ['search'] }, [results.length])
```

### 5. 중요한 옵션들

#### enableOnFormTags
- input, textarea, select 등에서도 단축키 작동 여부
- `true`: form 요소에서도 작동 (ESC, 화살표 키 등에 유용)
- `false` (기본값): form 요소에서는 작동 안 함

```typescript
// ESC는 input에서도 작동해야 함
useHotkeys('escape', handleClose, {
  scopes: ['modal'],
  enableOnFormTags: true
})

// Ctrl+S는 form 요소에서 브라우저 기본 동작 유지
useHotkeys('ctrl+s', handleSave, {
  enableOnFormTags: false
})
```

#### enabled
- Boolean 또는 함수로 조건부 활성화

```typescript
useHotkeys('down', callback, {
  scopes: ['sidebar'],
  enabled: focusedPane === 'sidebar' // 조건부 활성화
})
```

#### preventDefault
- 브라우저 기본 동작 방지

```typescript
useHotkeys('ctrl+s', handleSave, {
  preventDefault: true // 브라우저 저장 다이얼로그 방지
})
```

### 6. 키 표기법

#### 기본 표기
```typescript
'a'              // 단일 키
'ctrl+s'         // 조합 키
'cmd+shift+p'    // 여러 modifier
'f5'             // 기능 키
'*'              // 모든 키 (wildcard)
```

#### modifier 키워드
- `mod`: macOS에서는 cmd, 다른 OS에서는 ctrl
- `ctrl`, `shift`, `alt`, `meta`

#### 특수 키 표기 (KeyboardEvent.code 사용)
```typescript
// ❌ 문제가 될 수 있는 표기
'mod+shift+['    // 브라우저마다 인식이 다를 수 있음
'mod+shift+]'

// ✅ 안전한 표기 (KeyboardEvent.code)
'mod+shift+BracketLeft'
'mod+shift+BracketRight'
```

## 우리 프로젝트에서 발생한 문제

### 문제 상황
```typescript
// App.tsx
<HotkeysProvider initiallyActiveScopes={['sidebar']}>
  {/* ... */}
</HotkeysProvider>

// KeyboardShortcuts.tsx
useHotkeys('mod+\\', callback, { enableOnFormTags: true })
// ❌ scope를 지정하지 않아서 '*' scope에 속함
// ❌ 하지만 App.tsx에서 'sidebar'만 활성화했으므로 작동 안 함!
```

### 해결 방법 1: initiallyActiveScopes에 wildcard 추가
```typescript
// App.tsx
<HotkeysProvider initiallyActiveScopes={['*', 'sidebar']}>
  {/* ... */}
</HotkeysProvider>
```

### 해결 방법 2: 명시적으로 scope 지정
```typescript
// KeyboardShortcuts.tsx
useHotkeys('mod+\\', callback, {
  scopes: ['*'],
  enableOnFormTags: true
})
```

## 모범 사례

### 1. HotkeysProvider 설정
```typescript
// 전역 단축키와 특정 scope 모두 사용하는 경우
<HotkeysProvider initiallyActiveScopes={['*', 'sidebar', 'search']}>
  <App />
</HotkeysProvider>
```

### 2. 커스텀 hook 패턴
```typescript
// 반복되는 옵션을 캡슐화
const useHotkeysSidebar = (
  keys: string,
  callback: (e: KeyboardEvent) => void,
  deps: any[]
) => {
  useHotkeys(keys, callback, {
    scopes: ['sidebar'],
    enabled: focusedPane === 'sidebar',
    enableOnFormTags: true
  }, deps)
}

// 사용
useHotkeysSidebar('down', handleDown, [items.length])
useHotkeysSidebar('up', handleUp, [items.length])
```

### 3. 의존성 배열 확인
```typescript
// callback에서 사용하는 모든 외부 값을 deps에 포함
useHotkeys('enter', () => {
  if (selectedIndex >= 0 && selectedIndex < items.length) {
    handleSelect(items[selectedIndex])
  }
}, { scopes: ['search'] }, [selectedIndex, items, handleSelect])
```

## 디버깅 팁

### 1. 콘솔 로그로 확인
```typescript
useHotkeys('cmd+k', (e) => {
  console.log('[DEBUG] Key pressed:', e.key, 'viewMode:', viewMode)
  // 실제 로직
}, { scopes: ['*'] })
```

### 2. scope 활성화 상태 확인
```typescript
const { enabledScopes } = useHotkeysContext()
console.log('Active scopes:', enabledScopes)
```

### 3. enabled 옵션으로 조건 확인
```typescript
useHotkeys('down', callback, {
  scopes: ['sidebar'],
  enabled: () => {
    console.log('[DEBUG] Hotkey enabled check:', focusedPane === 'sidebar')
    return focusedPane === 'sidebar'
  }
})
```

## 참고 자료
- [공식 문서 - useHotkeys API](https://react-hotkeys-hook.vercel.app/docs/api/use-hotkeys)
- [공식 문서 - Scoping Hotkeys](https://react-hotkeys-hook.vercel.app/docs/documentation/useHotkeys/scoping-hotkeys)
- [공식 문서 - HotkeysProvider](https://react-hotkeys-hook.vercel.app/docs/documentation/hotkeys-provider)

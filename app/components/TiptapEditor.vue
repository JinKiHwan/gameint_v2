<template>
  <div class="tiptap-editor-wrapper">
    <!-- 툴바 -->
    <div v-if="editor" class="editor-toolbar">
      <button class="toolbar-btn" :class="{ 'is-active': editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()" title="굵게">
        <i class="mdi mdi-format-bold"></i>
      </button>
      <button class="toolbar-btn" :class="{ 'is-active': editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()" title="기울임">
        <i class="mdi mdi-format-italic"></i>
      </button>
      <button class="toolbar-btn" :class="{ 'is-active': editor.isActive('strike') }" @click="editor.chain().focus().toggleStrike().run()" title="취소선">
        <i class="mdi mdi-format-strikethrough"></i>
      </button>

      <div class="toolbar-divider"></div>

      <button class="toolbar-btn" :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" title="제목1">
        <i class="mdi mdi-format-header-1"></i>
      </button>
      <button class="toolbar-btn" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" title="제목2">
        <i class="mdi mdi-format-header-2"></i>
      </button>

      <div class="toolbar-divider"></div>

      <button class="toolbar-btn" :class="{ 'is-active': editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()" title="목록">
        <i class="mdi mdi-format-list-bulleted"></i>
      </button>
      <button class="toolbar-btn" :class="{ 'is-active': editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()" title="번호 목록">
        <i class="mdi mdi-format-list-numbered"></i>
      </button>
      <button class="toolbar-btn" :class="{ 'is-active': editor.isActive('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()" title="인용">
        <i class="mdi mdi-format-quote-close"></i>
      </button>
    </div>

    <!-- Tiptap 렌더링 영역 -->
    <editor-content :editor="editor" class="editor-content" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])
const editor = ref(null)
let isUpdateFromEditor = false

onMounted(() => {
  editor.value = new Editor({
    content: props.modelValue,
    extensions: [StarterKit],
    onUpdate: ({ editor }) => {
      isUpdateFromEditor = true
      emit('update:modelValue', editor.getHTML())
    }
  })
})

onBeforeUnmount(() => { if (editor.value) editor.value.destroy() })

watch(() => props.modelValue, (value) => {
  if (isUpdateFromEditor) { isUpdateFromEditor = false; return }
  const isSame = editor.value && editor.value.getHTML() === value
  if (!isSame && editor.value) editor.value.commands.setContent(value, false)
})
</script>

<style scoped>
.tiptap-editor-wrapper {
  border: 1.5px solid #E0E0E0;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: #1E88E5;
    box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.12);
  }
}

.editor-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: 6px 8px;
  background: #F5F5F5;
  border-bottom: 1px solid #E0E0E0;
  gap: 2px;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #424242;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.15s;

  &:hover { background: #E0E0E0; }
  &.is-active { background: #E3F2FD; color: #1E88E5; }
}

.toolbar-divider {
  width: 1px;
  height: 22px;
  background: #E0E0E0;
  margin: 0 4px;
}

.editor-content { padding: 16px; min-height: 400px; cursor: text; }
</style>

<style>
/* ProseMirror 글로벌 스타일 (scoped 밖) */
.ProseMirror {
  outline: none;
  min-height: 380px;
  line-height: 1.6;
}
.ProseMirror p { margin: 0.5em 0; }
.ProseMirror p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: "자유롭게 내용을 작성해주세요...";
  float: left;
  height: 0;
  pointer-events: none;
}
.ProseMirror blockquote {
  border-left: 4px solid #DFE2E5;
  padding-left: 1rem;
  margin-left: 0;
  color: #6A737D;
  background: #f8f9fa;
  padding-top: 4px;
  padding-bottom: 4px;
  border-radius: 0 4px 4px 0;
}
.ProseMirror code {
  background-color: #F6F8FA;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 85%;
}
.ProseMirror ul, .ProseMirror ol { padding-left: 1.5rem; margin: 0.5em 0; }
.ProseMirror h1 { font-size: 1.75rem; font-weight: 900; margin: 1rem 0 0.5rem; }
.ProseMirror h2 { font-size: 1.375rem; font-weight: 700; margin: 0.8rem 0 0.4rem; }
</style>

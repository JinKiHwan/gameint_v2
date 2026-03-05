<template>
  <div class="tiptap-editor-wrapper border rounded-lg bg-white overflow-hidden">
    <!-- 에디터 툴바 -->
    <div v-if="editor" class="toolbar d-flex align-center flex-wrap px-2 py-1 bg-grey-lighten-4 border-b">
      <v-btn
        variant="text"
        size="small"
        icon="mdi-format-bold"
        class="rounded"
        :color="editor.isActive('bold') ? 'blue-darken-1' : 'grey-darken-3'"
        @click="editor.chain().focus().toggleBold().run()"
      ></v-btn>
      <v-btn
        variant="text"
        size="small"
        icon="mdi-format-italic"
        class="rounded"
        :color="editor.isActive('italic') ? 'blue-darken-1' : 'grey-darken-3'"
        @click="editor.chain().focus().toggleItalic().run()"
      ></v-btn>
      <v-btn
        variant="text"
        size="small"
        icon="mdi-format-strikethrough"
        class="rounded"
        :color="editor.isActive('strike') ? 'blue-darken-1' : 'grey-darken-3'"
        @click="editor.chain().focus().toggleStrike().run()"
      ></v-btn>
      
      <v-divider vertical class="mx-2 my-2"></v-divider>

      <v-btn
        variant="text"
        size="small"
        icon="mdi-format-header-1"
        class="rounded"
        :color="editor.isActive('heading', { level: 1 }) ? 'blue-darken-1' : 'grey-darken-3'"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
      ></v-btn>
      <v-btn
        variant="text"
        size="small"
        icon="mdi-format-header-2"
        class="rounded"
        :color="editor.isActive('heading', { level: 2 }) ? 'blue-darken-1' : 'grey-darken-3'"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      ></v-btn>

      <v-divider vertical class="mx-2 my-2"></v-divider>

      <v-btn
        variant="text"
        size="small"
        icon="mdi-format-list-bulleted"
        class="rounded"
        :color="editor.isActive('bulletList') ? 'blue-darken-1' : 'grey-darken-3'"
        @click="editor.chain().focus().toggleBulletList().run()"
      ></v-btn>
      <v-btn
        variant="text"
        size="small"
        icon="mdi-format-list-numbered"
        class="rounded"
        :color="editor.isActive('orderedList') ? 'blue-darken-1' : 'grey-darken-3'"
        @click="editor.chain().focus().toggleOrderedList().run()"
      ></v-btn>
      <v-btn
        variant="text"
        size="small"
        icon="mdi-format-quote-close"
        class="rounded"
        :color="editor.isActive('blockquote') ? 'blue-darken-1' : 'grey-darken-3'"
        @click="editor.chain().focus().toggleBlockquote().run()"
      ></v-btn>
    </div>

    <!-- Tiptap 렌더링 영역 -->
    <editor-content :editor="editor" class="editor-content pa-4" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const editor = ref(null)

// 무한 루프 방지용 플래그
let isUpdateFromEditor = false

// Tiptap 에디터 초기화
onMounted(() => {
  editor.value = new Editor({
    content: props.modelValue,
    extensions: [
      StarterKit
    ],
    onUpdate: ({ editor }) => {
      // 에디터 내용이 변경될 때 v-model 업데이트
      isUpdateFromEditor = true
      emit('update:modelValue', editor.getHTML())
    }
  })
})

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})

// 부모 컴포넌트에서 강제로 값을 변경할 때 에디터 내용 동기화
watch(() => props.modelValue, (value) => {
  if (isUpdateFromEditor) {
    isUpdateFromEditor = false
    return
  }
  
  const isSame = editor.value && editor.value.getHTML() === value
  if (!isSame && editor.value) {
    editor.value.commands.setContent(value, false)
  }
})
</script>

<style>
/* Tiptap 에디터 필수 기본 스타일 */
.editor-content {
  min-height: 400px;
  cursor: text;
}

.ProseMirror {
  outline: none;
  min-height: 400px;
}

.ProseMirror p {
  margin: 0.5em 0;
  line-height: 1.6;
}

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
}

.ProseMirror code {
  background-color: #F6F8FA;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 85%;
}
</style>

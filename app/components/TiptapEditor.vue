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

      <v-spacer></v-spacer>
      
      <!-- 커스텀 이미지 업로드 버튼 -->
      <v-btn
        color="blue-darken-1"
        variant="tonal"
        size="small"
        prepend-icon="mdi-image-plus"
        class="font-weight-bold rounded-lg mr-2"
        :loading="uploading"
        @click="triggerImageUpload"
      >
        이미지 추가
      </v-btn>
      <input 
        type="file" 
        ref="fileInput" 
        accept="image/*" 
        style="display: none" 
        @change="handleFileUpload" 
      />
    </div>

    <!-- Tiptap 렌더링 영역 -->
    <editor-content :editor="editor" class="editor-content pa-4" />
    
    <!-- 업로드 로딩 오버레이 -->
    <v-overlay :model-value="uploading" class="align-center justify-center" contained>
      <div class="text-center bg-white pa-4 rounded-xl border elevation-2">
        <v-progress-circular indeterminate color="blue-darken-1" size="40" class="mb-2"></v-progress-circular>
        <div class="text-caption font-weight-bold text-grey-darken-3">이미지를 최적화하여 업로드 중입니다...</div>
      </div>
    </v-overlay>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { useBoard } from '~/composables/useBoard'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const editor = ref(null)
const fileInput = ref(null)
const uploading = ref(false)
const { uploadImage } = useBoard()

// 무한 루프 방지용 플래그
let isUpdateFromEditor = false

// Tiptap 에디터 초기화
onMounted(() => {
  editor.value = new Editor({
    content: props.modelValue,
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true
      })
    ],
    onUpdate: ({ editor }) => {
      // 에디터 내용이 변경될 때 v-model 업데이트
      isUpdateFromEditor = true
      emit('update:modelValue', editor.getHTML())
    },
    // 에디터에 파일을 직접 드래그앤드랍 했을 때 가로채는 핸들러
    editorProps: {
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0]
          if (file.type.startsWith('image/')) {
            uploadAndInsertImage(file)
            return true // Tiptap의 기본 동작 중단
          }
        }
        return false
      },
      handlePaste: (view, event, slice) => {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items
        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            const file = item.getAsFile()
            if (file) {
              uploadAndInsertImage(file)
              return true
            }
          }
        }
        return false
      }
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

// 파일 버튼 클릭 처리
const triggerImageUpload = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  await uploadAndInsertImage(file)
  event.target.value = '' // 초기화
}

// 실제 업로드 로직 및 에디터 삽입
const uploadAndInsertImage = async (file) => {
  uploading.value = true
  try {
    // 1. Storage에 압축 업로드 후 url 가져오기
    const url = await uploadImage(file)
    
    // 2. 에디터 커서 위치에 이미지 태그 삽입
    editor.value.chain().focus().setImage({ src: url }).run()
  } catch (err) {
    alert('이미지 업로드에 실패했습니다: ' + err.message)
  } finally {
    uploading.value = false
  }
}
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

/* 삽입된 이미지 반응형 처리 */
.ProseMirror img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
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

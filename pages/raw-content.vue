<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <div class="flex-1 p-4 md:p-6">
      <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-4 md:p-6">
        <div class="flex justify-between items-center mb-4 md:mb-6">
          <h1 class="text-lg md:text-2xl font-bold">Contenu Brut</h1>
          <button
            @click="toggleExtraction"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-colors',
              isExtractionEnabled
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            ]"
          >
            {{ isExtractionEnabled ? 'Extraction Activée' : 'Extraction Désactivée' }}
          </button>
        </div>

        <div v-if="pending" class="flex justify-center items-center p-4">
          <ProgressSpinner />
          <span class="ml-2">Chargement du contenu...</span>
        </div>

        <div v-else-if="error" class="text-red-500 p-4">
          <Message severity="error" :closable="false">
            Une erreur est survenue lors du chargement du contenu
          </Message>
        </div>

        <template v-else>
          <Card v-for="content in extractedContents" :key="content.timestamp.$date" class="mb-4">
            <template #content>
              <div class="content-actions mb-4">
                <Button class="copy-content text-sm md:text-base" @click="copyContent(content)">
                  📋 Copier le contenu
                </Button>
              </div>
              <div class="bg-gray-100 p-4 rounded-lg">
                <pre class="whitespace-pre-wrap break-words">{{ content.extractedContent }}</pre>
              </div>
            </template>
          </Card>
        </template>
      </div>
    </div>
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRuntimeConfig } from '#app'
import { io } from 'socket.io-client'

interface ExtractedContent {
  _id: string
  extractedContent: string
  status: string
  timestamp: {
    $date: string
  }
  __v: number
  error?: string
}

const extractedContents = ref<ExtractedContent[]>([])
const isExtractionEnabled = ref(false)
const pending = ref(true)
const error = ref(false)

const toast = useToast()
const config = useRuntimeConfig()
const socket = io(config.public.socketUrl)

// Fonction pour récupérer l'état initial de l'extraction
const fetchExtractionState = async () => {
  try {
    const response = await fetch(`${useRuntimeConfig().public.socketUrl}/api/config/extract_quiz_enabled`)
    const data = await response.json()
    isExtractionEnabled.value = data.value
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'état de l\'extraction:', error)
  }
}

// Fonction pour basculer l'état de l'extraction
const toggleExtraction = async () => {
  try {
    const newValue = !isExtractionEnabled.value
    await fetch(`${useRuntimeConfig().public.socketUrl}/api/config/extract_quiz_enabled`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: newValue }),
    })
    isExtractionEnabled.value = newValue
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'état de l\'extraction:', error)
  }
}

// Fonction pour copier le contenu
const copyContent = (content: ExtractedContent) => {
  navigator.clipboard.writeText(content.extractedContent)
  toast.add({ severity: 'success', summary: 'Contenu copié', detail: 'Le contenu a été copié dans le presse-papiers', life: 3000 })
}

// Récupérer les données initiales
const fetchInitialData = async () => {
  try {
    const response = await fetch(`${useRuntimeConfig().public.socketUrl}/api/extracted-quizzes`)
    const data = await response.json()
    extractedContents.value = data
    pending.value = false
  } catch (err) {
    error.value = true
    pending.value = false
    console.error('Erreur lors de la récupération du contenu:', err)
  }
}

// Gérer les mises à jour en temps réel
const handleNewExtractedQuiz = (quiz: ExtractedContent) => {
  extractedContents.value = [quiz, ...extractedContents.value]
  toast.add({ 
    severity: 'info', 
    summary: 'Nouveau contenu en cours d\'extraction', 
    detail: 'Le contenu est en cours de traitement', 
    life: 3000 
  })
}

const handleQuizExtracted = ({ id, extractedContent, status }: { id: string, extractedContent: string, status: string }) => {
  const index = extractedContents.value.findIndex(q => q._id === id)
  if (index !== -1) {
    extractedContents.value[index] = {
      ...extractedContents.value[index],
      extractedContent,
      status
    }
    toast.add({ 
      severity: 'success', 
      summary: 'Extraction terminée', 
      detail: 'Le contenu a été extrait avec succès', 
      life: 3000 
    })
  }
}

const handleQuizIgnored = ({ id, extractedContent, status }: { id: string, extractedContent: string, status: string }) => {
  const index = extractedContents.value.findIndex(q => q._id === id)
  if (index !== -1) {
    extractedContents.value[index] = {
      ...extractedContents.value[index],
      extractedContent,
      status
    }
    toast.add({ 
      severity: 'warn', 
      summary: 'Aucun QCM trouvé', 
      detail: 'Aucun QCM n\'a été trouvé dans le contenu', 
      life: 3000 
    })
  }
}

const handleExtractionError = ({ id, error }: { id: string, error: string }) => {
  const index = extractedContents.value.findIndex(q => q._id === id)
  if (index !== -1) {
    extractedContents.value[index] = {
      ...extractedContents.value[index],
      status: 'error',
      error
    }
    toast.add({ 
      severity: 'error', 
      summary: 'Erreur d\'extraction', 
      detail: error, 
      life: 5000 
    })
  }
}

// Récupérer l'état initial au chargement de la page
onMounted(() => {
  fetchExtractionState()
  fetchInitialData()

  // Écouter les événements Socket.IO
  socket.on('newExtractedQuiz', handleNewExtractedQuiz)
  socket.on('quizExtracted', handleQuizExtracted)
  socket.on('quizIgnored', handleQuizIgnored)
  socket.on('extractionError', handleExtractionError)
})

onUnmounted(() => {
  socket.disconnect()
})
</script> 
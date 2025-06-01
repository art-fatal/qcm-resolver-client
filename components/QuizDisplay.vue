<template>
  <div class="p-1 md:p-4">
    <div v-if="pending" class="flex justify-center items-center p-1 md:p-8">
      <ProgressSpinner />
      <span class="ml-2">Chargement des quiz...</span>
    </div>

    <div v-else-if="error" class="text-red-500 p-1 md:p-4">
      <Message severity="error" :closable="false">
        Une erreur est survenue lors du chargement des quiz
      </Message>
    </div>

    <template v-else>
      <Card v-for="quiz in quizzes" :key="quiz._id" class="mb-4 !p-1 md:!p-4">
        <template #content>
          <div class="history-content">
            <div class="quiz-container">
              <div class="quiz-actions mb-4">
                <Button class="copy-quiz text-sm md:text-base" @click="copyQuiz(quiz)">
                  📋 Copier le quiz
                </Button>
              </div>
              <div v-for="(question, qIndex) in quiz.content?.data?.generated" :key="qIndex" class="quiz-question mb-4 md:mb-6">
                <div class="question-text text-base md:text-lg font-semibold mb-2 md:mb-3">{{ question.qtext }}</div>
                <div class="question-options space-y-1 md:space-y-2">
                  <div 
                    v-for="(option, oIndex) in question.fieldset.split('\n')" 
                    :key="oIndex"
                    v-show="option.trim()"
                    class="option p-2 md:p-3 bg-gray-50 rounded-lg text-sm md:text-base"
                  >
                    {{ option }}
                  </div>
                </div>
              </div>
              
              <!-- AI Solution Section -->
              <div v-if="quiz.aiSolution" class="mt-4 p-4 bg-green-50 rounded-lg">
                <h3 class="text-lg font-semibold mb-2">Solution AI</h3>
                <div class="prose prose-sm md:prose-base max-w-none">
                  <ClientOnly>
                    <div v-html="renderedSolutions.get(quiz._id) || ''"></div>
                  </ClientOnly>
                </div>
              </div>
              
              <!-- AI Error Section -->
              <div v-if="quiz.aiError" class="mt-4 p-4 bg-red-50 rounded-lg">
                <h3 class="text-lg font-semibold mb-2 text-red-600">Erreur AI</h3>
                <p>{{ quiz.aiError }}</p>
              </div>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-between items-center">
            <span class="text-xs md:text-sm text-gray-500">
              {{ new Date(quiz.timestamp).toLocaleString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }) }}
            </span>
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { io } from 'socket.io-client'

const toast = useToast()

interface Quiz {
  _id: string
  content: {
    url: string
    data: {
      Form: string[]
      generated: {
        qtext: string
        fieldset: string
      }[]
    }
  }
  timestamp: string
  aiSolution?: string
  aiError?: string
}

const quizzes = ref<Quiz[]>([])
const selectedAnswers = ref<Record<string, string>>({})
const renderedSolutions = ref(new Map<string, string>())

const config = useRuntimeConfig()
const socket = io(config.public.socketUrl)

const renderMarkdown = async (text: string) => {
  if (process.client) {
    const { marked } = await import('marked')
    const DOMPurify = (await import('dompurify')).default
    return DOMPurify.sanitize(marked(text))
  }
  return text
}

// Déplacer useFetch au niveau supérieur du composant
const { data: initialData, pending, error } = useFetch<Quiz[]>(config.public.socketUrl + '/api/data')

// Ajouter un watch pour déboguer le chargement des données
watch(initialData, async (newData) => {
  if (newData) {
    quizzes.value = newData
    // Traiter les solutions AI existantes
    for (const quiz of newData) {
      if (quiz.aiSolution) {
        renderedSolutions.value.set(quiz._id, await renderMarkdown(quiz.aiSolution))
      }
    }
  }
  console.log('Données initiales mises à jour:', newData)
}, { immediate: true })

const parseOptions = (fieldset: string) => {
  return fieldset.split(' ').filter(option => option.startsWith('a.') || option.startsWith('b.') || option.startsWith('c.') || option.startsWith('d.'))
}

const submitAnswer = (quizId: string) => {
  // Implémenter la logique de soumission des réponses ici
  console.log('Réponse soumise pour le quiz:', quizId, selectedAnswers.value[quizId])
}

const copyQuiz = (quiz: Quiz) => {
  const quizText = quiz.content.data.generated.map(question => {
    return `${question.qtext}\n${question.fieldset}`;
  }).join('\n\n');
  
  navigator.clipboard.writeText(quizText);
};

onMounted(async () => {
  socket.on('newData', async (data: Quiz) => {
    console.log('Nouvelles données reçues:', data)
    quizzes.value = [data, ...quizzes.value]
    
    if (data.aiSolution) {
      renderedSolutions.value.set(data._id, await renderMarkdown(data.aiSolution))
    }
    
    toast.add({ severity: 'success', summary: 'Nouveau quiz disponible', detail: 'Un nouveau quiz est disponible', life: 5000 });
  })

  socket.on('aiSolution', async ({ id, aiSolution }) => {
    console.log('Solution AI reçue:', id, aiSolution)
    const quizIndex = quizzes.value.findIndex(q => q._id === id)
    if (quizIndex !== -1) {
      quizzes.value[quizIndex].aiSolution = aiSolution
      renderedSolutions.value.set(id, await renderMarkdown(aiSolution))
      toast.add({ severity: 'success', summary: 'Solution AI disponible', detail: 'La solution AI est maintenant disponible', life: 5000 });
    }
  })

  socket.on('aiError', ({ id, error }) => {
    console.log('Erreur AI reçue:', id, error)
    const quizIndex = quizzes.value.findIndex(q => q._id === id)
    if (quizIndex !== -1) {
      quizzes.value[quizIndex].aiError = error
      toast.add({ severity: 'error', summary: 'Erreur AI', detail: 'Une erreur est survenue lors du traitement AI', life: 5000 });
    }
  })
})

onUnmounted(() => {
  socket.disconnect()
})
</script>

<style>
.p-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  padding: 1.5rem;
  margin-bottom: 1rem;
  border-radius: 6px;
  box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12);
}

.p-card-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--surface-border);
}

.p-card-content {
  padding: 1.5rem;
}

.p-card-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--surface-border);
}

.p-card-body {
  padding: 0.5rem;
}

.p-card-content {
  padding: 0.5rem;
}
</style> 
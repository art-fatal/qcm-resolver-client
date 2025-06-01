<template>
  <div class="p-4">
    <div v-if="pending" class="flex justify-center items-center p-8">
      <ProgressSpinner />
      <span class="ml-2">Chargement des quiz...</span>
    </div>

    <div v-else-if="error" class="text-red-500 p-4">
      <Message severity="error" :closable="false">
        Une erreur est survenue lors du chargement des quiz
      </Message>
    </div>

    <template v-else>
      <Card v-for="quiz in quizzes" :key="quiz._id" class="mb-4">
        <template #content>
          <div class="history-content">
            <div class="quiz-container">
              <div class="quiz-actions mb-4">
                <Button class="copy-quiz" @click="copyQuiz(quiz)">
                  📋 Copier le quiz
                </Button>
              </div>
              <div v-for="(question, qIndex) in quiz.content?.data?.generated" :key="qIndex" class="quiz-question mb-6">
                <div class="question-text text-lg font-semibold mb-3">{{ question.qtext }}</div>
                <div class="question-options space-y-2">
                  <div 
                    v-for="(option, oIndex) in question.fieldset.split('\n')" 
                    :key="oIndex"
                    v-show="option.trim()"
                    class="option p-3 bg-gray-50 rounded-lg"
                  >
                    {{ option }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">
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
import { ref, onMounted, onUnmounted } from 'vue'
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
}

const quizzes = ref<Quiz[]>([])
const selectedAnswers = ref<Record<string, string>>({})

// Utilisation de la variable d'environnement
const config = useRuntimeConfig()
const socket = io(config.public.socketUrl)

// Récupération des données initiales
const { data: initialData, pending, error } = await useFetch<Quiz[]>(config.public.socketUrl + '/api/data')

// Mise à jour des quiz avec les données initiales
if (initialData.value) {
  quizzes.value = initialData.value
}

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

onMounted(() => {
  socket.on('newData', (data: Quiz) => {
    console.log('Nouvelles données reçues:', data)
    quizzes.value = [data, ...quizzes.value]
    
    toast.add({ severity: 'success', summary: 'Nouveau quiz disponible', detail: 'Un nouveau quiz est disponible', life: 5000 });
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
</style> 
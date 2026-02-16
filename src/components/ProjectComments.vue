<script>
import { mapGetters, mapState } from 'vuex'
import { get } from 'lodash'
import AppAvatar from 'src/components/AppAvatar'
import { matSend } from '@quasar/extras/material-icons'

export default {
  name: 'ProjectComments',
  components: {
    AppAvatar
  },
  props: {
    asset: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      comments: [],
      newComment: '',
      submitting: false,
      loading: true
    }
  },
  computed: {
    ...mapGetters(['currentUser', 'ratingsActive']),
    ...mapState(['style']),
    isDarkMode () {
      return true // Assuming dark mode for the high-tech theme
    },
    sortedComments () {
      return [...this.comments].sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
    }
  },
  created () {
    this.icons = { matSend }
    this.fetchComments()
  },
  methods: {
    async fetchComments () {
      this.loading = true
      try {
        // We use the ratings system for comments. 
        // We fetch ratings associated with this asset.
        const ratings = await this.$store.dispatch('fetchRatingsByTransaction', { assetId: this.asset.id })
        this.comments = ratings
        this.$emit('update-count', this.comments.length)
      } catch (err) {
        console.error('Failed to fetch comments:', err)
      } finally {
        this.loading = false
      }
    },
    async postComment () {
      if (!this.newComment.trim() || this.submitting) return

      this.submitting = true
      try {
        // Stelace ratings require a score. For simple comments, we can default to 5 or just not show it in the UI.
        // Also, ratings usually require a transactionId, but the Stelace API also allows global ratings or asset-specific ones.
        // However, the marketplace setup often ties ratings to transactions.
        // If we want "free" comments, we might need to check if the API allows it without a transaction.
        // For this demo, we'll try to create a rating with minimal attributes.
        
        await this.$store.dispatch('createRating', {
          attrs: {
            assetId: this.asset.id,
            authorId: this.currentUser.id,
            targetId: this.asset.ownerId,
            comment: this.newComment,
            score: 5, // Default score
            label: 'main'
          }
        })

        this.newComment = ''
        await this.fetchComments()
        this.$q.notify({
          message: 'Comment posted successfully',
          color: 'positive',
          position: 'bottom'
        })
      } catch (err) {
        console.error('Failed to post comment:', err)
        this.$q.notify({
          message: 'Failed to post comment. You might need to have a transaction with this project first.',
          color: 'negative',
          position: 'bottom'
        })
      } finally {
        this.submitting = false
      }
    },
    formatDate (dateString) {
      if (!dateString) return ''
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }
}
</script>

<template>
  <div class="project-comments q-py-md">
    <!-- Comment Input -->
    <div v-if="currentUser.id" class="comment-input-section q-mb-xl">
      <div class="row q-gutter-x-md items-start">
        <AppAvatar :user="currentUser" size="40px" />
        <div class="col">
          <QInput
            v-model="newComment"
            type="textarea"
            filled
            dark
            placeholder="Add a technical comment..."
            auto-grow
            class="comment-textarea font-mono"
            :input-style="{ minHeight: '80px' }"
          />
          <div class="row justify-end q-mt-sm">
            <QBtn
              unelevated
              color="primary"
              label="Post Comment"
              :icon="icons.matSend"
              :loading="submitting"
              :disable="!newComment.trim()"
              @click="postComment"
              class="font-mono button-rounded"
              no-caps
            />
          </div>
        </div>
      </div>
    </div>
    <div v-else class="q-mb-xl q-pa-md round-md border-light text-center bg-surface">
      <p class="text-grey font-mono q-mb-none">Please login to join the discussion.</p>
    </div>

    <!-- Comments List -->
    <div v-if="loading" class="flex flex-center q-py-xl">
      <QSpinner color="primary" size="40px" />
    </div>
    <div v-else-if="sortedComments.length === 0" class="text-center q-py-xl border-light round-md bg-surface">
      <p class="text-grey font-mono q-mb-none">No comments yet. Be the first to start the thread!</p>
    </div>
    <div v-else class="q-gutter-y-lg">
      <div v-for="comment in sortedComments" :key="comment.id" class="comment-item row q-gutter-x-md items-start">
        <AppAvatar :user="comment.owner" size="40px" />
        <div class="col">
          <div class="comment-bubble q-pa-md round-md" :class="isDarkMode ? 'bg-surface border-light' : 'bg-grey-2'">
            <div class="row justify-between items-center q-mb-sm">
              <div class="text-weight-bold font-mono text-primary">{{ comment.owner.displayName || 'Maker' }}</div>
              <div class="text-caption text-grey font-mono">{{ formatDate(comment.createdDate) }}</div>
            </div>
            <div class="text-body2 font-mono line-height-14 text-grey-3">
              {{ comment.comment || comment.content }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
.comment-textarea
  border-radius: 8px
  overflow: hidden

.comment-bubble
  position: relative
  &::before
    content: ''
    position: absolute
    left: -6px
    top: 15px
    width: 12px
    height: 12px
    transform: rotate(45deg)
    background: inherit
    border-left: 1px solid rgba(255, 255, 255, 0.1)
    border-bottom: 1px solid rgba(255, 255, 255, 0.1)

.bg-surface
  background: #111111

.border-light
  border: 1px solid rgba(255, 255, 255, 0.1)

.round-md
  border-radius: 12px

.button-rounded
  border-radius: 8px

.line-height-14
  line-height: 1.6
</style>

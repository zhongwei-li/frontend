<template>
	<div class="heading">
		<h1 class="title task-id">{{ textIdentifier }}</h1>
		<Done class="heading__done" :is-done="task.done" />
		<h1
			class="title input"
			:class="{'disabled': !canWrite}"
			@blur="save($event.target.textContent)"
			@keydown.enter.prevent.stop="$event.target.blur()"
			:contenteditable="canWrite ? true : undefined"
			:spellcheck="false"
		>
			{{ task.title.trim() }}
		</h1>
		<transition name="fade">
			<span class="is-inline-flex is-align-items-center" v-if="loading && saving">
				<span class="loader is-inline-block mr-2"></span>
				{{ $t('misc.saving') }}
			</span>
			<span class="has-text-success is-inline-flex is-align-content-center" v-else-if="!loading && showSavedMessage">
				<icon icon="check" class="mr-2"/>
				{{ $t('misc.saved') }}
			</span>
		</transition>
	</div>
</template>

<script>
import {mapState} from 'vuex'

import Done from '@/components/misc/Done.vue'

export default {
	name: 'heading',
	components: {
		Done,
	},
	data() {
		return {
			showSavedMessage: false,
			saving: false, // Since loading is global state, this variable ensures we're only showing the saving icon when saving the description.
		}
	},
	computed: {
		...mapState(['loading']),
		task() {
			return this.modelValue
		},
		textIdentifier() {
			return this.task?.getTextIdentifier() || ''
		},
	},
	props: {
		modelValue: {
			required: true,
		},
		canWrite: {
			type: Boolean,
			default: false,
		},
	},

	emits: ['update:modelValue'],

	methods: {
		async save(title) {
			// We only want to save if the title was actually changed.
			// Because the contenteditable does not have a change event
			// we're building it ourselves and only continue
			// if the task title changed.
			if (title === this.task.title) {
				return
			}

			this.saving = true

			const newTask = {
				...this.task,
				title,
			}

			try {
				const task = await this.$store.dispatch('tasks/update', newTask)
				this.$emit('update:modelValue', task)
				this.showSavedMessage = true
				setTimeout(() => {
					this.showSavedMessage = false
				}, 2000)
			}
			finally {
				this.saving = false
			}
		},
	},
}
</script>

<style lang="scss" scoped>
.heading__done {
	margin-left: .5rem;
}
</style>
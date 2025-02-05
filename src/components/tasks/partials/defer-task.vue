<template>
	<div
		:class="{ 'is-loading': taskService.loading }"
		class="defer-task loading-container"
	>
		<label class="label">{{ $t('task.deferDueDate.title') }}</label>
		<div class="defer-days">
			<x-button
				@click.prevent.stop="() => deferDays(1)"
				:shadow="false"
				type="secondary"
			>
				{{ $t('task.deferDueDate.1day') }}
			</x-button>
			<x-button
				@click.prevent.stop="() => deferDays(3)"
				:shadow="false"
				type="secondary"
			>
				{{ $t('task.deferDueDate.3days') }}
			</x-button>
			<x-button
				@click.prevent.stop="() => deferDays(7)"
				:shadow="false"
				type="secondary"
			>
				{{ $t('task.deferDueDate.1week') }}
			</x-button>
		</div>
		<flat-pickr
			:class="{ disabled: taskService.loading }"
			:config="flatPickerConfig"
			:disabled="taskService.loading || null"
			class="input"
			v-model="dueDate"
		/>
	</div>
</template>

<script>
import TaskService from '../../../services/task'
import flatPickr from 'vue-flatpickr-component'

export default {
	name: 'defer-task',
	data() {
		return {
			taskService: new TaskService(),
			task: null,
			// We're saving the due date seperately to prevent null errors in very short periods where the task is null.
			dueDate: null,
			lastValue: null,
			changeInterval: null,
		}
	},
	components: {
		flatPickr,
	},
	props: {
		modelValue: {
			required: true,
		},
	},
	emits: ['update:modelValue'],

	watch: {
		modelValue: {
			handler(value) {
				this.task = value
				this.dueDate = value.dueDate
				this.lastValue = value.dueDate
			},
			immediate: true,
		},
	},
	mounted() {
		// Because we don't really have other ways of handling change since if we let flatpickr
		// change events trigger updates, it would trigger a flatpickr change event which would trigger
		// an update which would trigger a change event and so on...
		// This is either a bug in flatpickr or in the vue component of it.
		// To work around that, we're only updating if something changed and check each second and when closing the popup.
		if (this.changeInterval) {
			clearInterval(this.changeInterval)
		}

		this.changeInterval = setInterval(this.updateDueDate, 1000)
	},
	beforeUnmount() {
		if (this.changeInterval) {
			clearInterval(this.changeInterval)
		}
		this.updateDueDate()
	},
	computed: {
		flatPickerConfig() {
			return {
				altFormat: this.$t('date.altFormatLong'),
				altInput: true,
				dateFormat: 'Y-m-d H:i',
				enableTime: true,
				time_24hr: true,
				inline: true,
				locale: {
					firstDayOfWeek: this.$store.state.auth.settings.weekStart,
				},
			}
		},
	},
	methods: {
		deferDays(days) {
			this.dueDate = new Date(this.dueDate)
			this.dueDate = this.dueDate.setDate(this.dueDate.getDate() + days)
			this.updateDueDate()
		},

		async updateDueDate() {
			if (!this.dueDate) {
				return
			}

			if (+new Date(this.dueDate) === +this.lastValue) {
				return
			}

			this.task.dueDate = new Date(this.dueDate)
			const task = await this.taskService.update(this.task)
			this.lastValue = task.dueDate
			this.task = task
			this.$emit('update:modelValue', task)
		},
	},
}
</script>

<style lang="scss" scoped>
// 100px is roughly the size the pane is pulled to the right
$defer-task-max-width: 350px + 100px;

.defer-task {
	position: absolute;
	width: 100%;
	max-width: $defer-task-max-width;
	border-radius: $radius;
	border: 1px solid var(--grey-200);
	padding: 1rem;
	margin: 1rem;
	background: var(--white);
	color: var(--text);
	cursor: default;
	z-index: 10;
	box-shadow: var(--shadow-lg);

	@media screen and (max-width: ($defer-task-max-width)) {
		left: .5rem;
		right: .5rem;
		max-width: 100%;
		width: calc(100vw - 1rem - 2rem);
	}
}

.defer-days {
	justify-content: space-between;
	display: flex;
	margin: .5rem 0;
}

:deep() {
	input.input {
		display: none;
	}

	.flatpickr-calendar {
		margin: 0 auto;
		box-shadow: none;

		@media screen and (max-width: ($defer-task-max-width)) {
			max-width: 100%;
		}

		span {
			width: auto !important;
		}

	}

	.flatpickr-innerContainer {
		@media screen and (max-width: ($defer-task-max-width)) {
			overflow: scroll;
		}
	}
}
</style>
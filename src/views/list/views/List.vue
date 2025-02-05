<template>
	<div
		:class="{ 'is-loading': taskCollectionService.loading }"
		class="loader-container is-max-width-desktop list-view"
	>
		<div
			class="filter-container"
			v-if="list.isSavedFilter && !list.isSavedFilter()"
		>
			<div class="items">
				<div class="search">
					<div :class="{ hidden: !showTaskSearch }" class="field has-addons">
						<div class="control has-icons-left has-icons-right">
							<input
								@blur="hideSearchBar()"
								@keyup.enter="searchTasks"
								class="input"
								:placeholder="$t('misc.search')"
								type="text"
								v-focus
								v-model="searchTerm"
							/>
							<span class="icon is-left">
								<icon icon="search"/>
							</span>
						</div>
						<div class="control">
							<x-button
								:loading="taskCollectionService.loading"
								@click="searchTasks"
								:shadow="false"
							>
								{{ $t('misc.search') }}
							</x-button>
						</div>
					</div>
					<x-button
						@click="showTaskSearch = !showTaskSearch"
						icon="search"
						type="secondary"
						v-if="!showTaskSearch"
					/>
				</div>
				<filter-popup
					v-model="params"
					@update:modelValue="loadTasks()"
				/>
			</div>
		</div>

		<card :padding="false" :has-content="false" class="has-overflow">
			<template
				v-if="!list.isArchived && canWrite && list.id > 0"
			>
				<add-task
					@taskAdded="updateTaskList"
					ref="newTaskInput"
					:default-position="firstNewPosition"
				/>
			</template>

			<nothing v-if="ctaVisible && tasks.length === 0 && !taskCollectionService.loading">
				{{ $t('list.list.empty') }}
				<a @click="focusNewTaskInput()">
					{{ $t('list.list.newTaskCta') }}
				</a>
			</nothing>

			<div class="tasks-container" :class="{ 'has-task-edit-open': isTaskEdit }">
				<div
					class="tasks mt-0"
					v-if="tasks && tasks.length > 0"
				>
					<draggable
						v-bind="dragOptions"
						v-model="tasks"
						group="tasks"
						@start="() => drag = true"
						@end="saveTaskPosition"
						handle=".handle"
						:disabled="!canWrite"
						item-key="id"
						:component-data="{
							class: { 'dragging-disabled': !canWrite },
						}"
					>
						<template #item="{element: t}">
							<single-task-in-list
								:show-list-color="false"
								:disabled="!canWrite"
								:the-task="t"
								@taskUpdated="updateTasks"
								task-detail-route="task.detail"
							>
								<template v-if="canWrite">
									<span class="icon handle">
										<icon icon="grip-lines"/>
									</span>
									<div
										@click="editTask(t.id)"
										class="icon settings"
										v-if="!list.isArchived"
									>
										<icon icon="pencil-alt"/>
									</div>
								</template>
							</single-task-in-list>
						</template>
					</draggable>
				</div>
				<edit-task 
					v-if="isTaskEdit"
					class="taskedit mt-0"
					:title="$t('list.list.editTask')"
					@close="() => isTaskEdit = false"
					:shadow="false"
					:task="taskEditTask"
				/>
			</div>

			<Pagination
				:total-pages="taskCollectionService.totalPages"
				:current-page="currentPage"
			/>
		</card>

		<!-- This router view is used to show the task popup while keeping the kanban board itself -->
		<router-view v-slot="{ Component }">
			<transition name="modal">
				<component :is="Component"/>
			</transition>
		</router-view>
	</div>
</template>

<script>
import TaskService from '../../../services/task'
import TaskModel from '../../../models/task'

import EditTask from '../../../components/tasks/edit-task'
import AddTask from '../../../components/tasks/add-task'
import SingleTaskInList from '../../../components/tasks/partials/singleTaskInList'
import taskList from '../../../components/tasks/mixins/taskList'
import {saveListView} from '@/helpers/saveListView'
import Rights from '../../../models/constants/rights.json'
import FilterPopup from '@/components/list/partials/filter-popup.vue'
import {HAS_TASKS} from '@/store/mutation-types'
import Nothing from '@/components/misc/nothing.vue'
import Pagination from '@/components/misc/pagination.vue'
import Popup from '@/components/misc/popup'

import draggable from 'vuedraggable'
import {calculateItemPosition} from '../../../helpers/calculateItemPosition'

function sortTasks(tasks) {
	if (tasks === null || tasks === []) {
		return
	}
	return tasks.sort((a, b) => {
		if (a.done < b.done)
			return -1
		if (a.done > b.done)
			return 1

		if (a.position < b.position)
			return -1
		if (a.position > b.position)
			return 1
		return 0
	})
}

export default {
	name: 'List',
	data() {
		return {
			taskService: new TaskService(),
			isTaskEdit: false,
			taskEditTask: TaskModel,
			ctaVisible: false,
			showTaskSearch: false,

			drag: false,
			dragOptions: {
				animation: 100,
				ghostClass: 'ghost',
			},
		}
	},
	mixins: [
		taskList,
	],
	components: {
		Popup,
		Nothing,
		FilterPopup,
		SingleTaskInList,
		EditTask,
		AddTask,
		draggable,
		Pagination,
	},
	created() {
		// Save the current list view to local storage
		// We use local storage and not vuex here to make it persistent across reloads.
		saveListView(this.$route.params.listId, this.$route.name)
	},
	computed: {
		firstNewPosition() {
			if (this.tasks.length === 0) {
				return 0
			}

			return calculateItemPosition(null, this.tasks[0].position)
		},
		canWrite() {
			return this.list.maxRight > Rights.READ && this.list.id > 0
		},
		list() {
			return this.$store.state.currentList
		},
	},
	mounted() {
		this.$nextTick(() => (this.ctaVisible = true))
	},
	methods: {
		searchTasks() {
			// Only search if the search term changed
			if (this.$route.query === this.searchTerm) {
				return
			}

			this.$router.push({
				name: 'list.list',
				query: {search: this.searchTerm},
			})
		},
		hideSearchBar() {
			// This is a workaround.
			// When clicking on the search button, @blur from the input is fired. If we
			// would then directly hide the whole search bar directly, no click event
			// from the button gets fired. To prevent this, we wait 200ms until we hide
			// everything so the button has a chance of firering the search event.
			setTimeout(() => {
				this.showTaskSearch = false
			}, 200)
		},
		// This function initializes the tasks page and loads the first page of tasks
		initTasks(page, search = '') {
			this.taskEditTask = null
			this.isTaskEdit = false
			this.loadTasks(page, search)
		},
		focusNewTaskInput() {
			this.$refs.newTaskInput.$refs.newTaskInput.focus()
		},
		updateTaskList(task) {
			const tasks = [
				task,
				...this.tasks,
			]
			this.tasks = tasks
			this.$store.commit(HAS_TASKS, true)
		},
		editTask(id) {
			// Find the selected task and set it to the current object
			let theTask = this.getTaskById(id) // Somehow this does not work if we directly assign this to this.taskEditTask
			this.taskEditTask = theTask
			this.isTaskEdit = true
		},
		getTaskById(id) {
			for (const t in this.tasks) {
				if (this.tasks[t].id === parseInt(id)) {
					return this.tasks[t]
				}
			}
			return {} // FIXME: This should probably throw something to make it clear to the user noting was found
		},
		updateTasks(updatedTask) {
			for (const t in this.tasks) {
				if (this.tasks[t].id === updatedTask.id) {
					this.tasks[t] = updatedTask
					break
				}
			}
			sortTasks(this.tasks)
		},

		async saveTaskPosition(e) {
			this.drag = false

			const task = this.tasks[e.newIndex]
			const taskBefore = this.tasks[e.newIndex - 1] ?? null
			const taskAfter = this.tasks[e.newIndex + 1] ?? null

			const newTask = {
				...task,
				position: calculateItemPosition(taskBefore !== null ? taskBefore.position : null, taskAfter !== null ? taskAfter.position : null),
			}

			const updatedTask = await this.$store.dispatch('tasks/update', newTask)
			this.tasks[e.newIndex] = updatedTask
		},
	},
}
</script>

<style lang="scss" scoped>
.tasks-container {
	display: flex;

	&.has-task-edit-open {
		flex-direction: column;

		@media screen and (min-width: $tablet) {
			flex-direction: row;

			.tasks {
				width: 66%;
			}
		}
	}

	.tasks {
		width: 100%;
		padding: .5rem;

		.ghost {
			border-radius: $radius;
			background: var(--grey-100);
			border: 2px dashed var(--grey-300);

			* {
				opacity: 0;
			}
		}
	}

	.taskedit {
		width: 33%;
		margin-right: 1rem;
		margin-left: .5rem;
		min-height: calc(100% - 1rem);

		@media screen and (max-width: $tablet) {
			width: 100%;
			border-radius: 0;
			margin: 0;
			border-left: 0;
			border-right: 0;
			border-bottom: 0;
		}
	}
}

.list-view .task-add {
	padding: 1rem 1rem 0;
}
</style>
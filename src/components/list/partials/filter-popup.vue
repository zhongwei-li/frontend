<template>
	<x-button
		v-if="hasFilters"
		type="secondary"
		@click="clearFilters"
	>
		{{ $t('filters.clear') }}
	</x-button>
	<popup>
		<template #trigger="{toggle}">
			<x-button
				@click.prevent.stop="toggle()"
				type="secondary"
				icon="filter"
			>
				{{ $t('filters.title') }}
			</x-button>
		</template>
		<template #content="{isOpen}">
			<filters
				v-model="value"
				ref="filters"
				class="filter-popup"
				:class="{'is-open': isOpen}"
			/>
		</template>
	</popup>
</template>

<script>
import Filters from '@/components/list/partials/filters'
import {getDefaultParams} from '@/components/tasks/mixins/taskList'
import Popup from '@/components/misc/popup'

export default {
	name: 'filter-popup',
	components: {
		Popup,
		Filters,
	},
	props: {
		modelValue: {
			required: true,
		},
	},
	emits: ['update:modelValue'],
	computed: {
		value: {
			get() {
				return this.modelValue
			},
			set(value) {
				this.$emit('update:modelValue', value)
			},
		},
		hasFilters() {
			// this.value also contains the page parameter which we don't want to include in filters
			// eslint-disable-next-line no-unused-vars
			const {filter_by, filter_value, filter_comparator, filter_concat, s} = this.value
			const def = {...getDefaultParams()}

			const params = {filter_by, filter_value, filter_comparator, filter_concat, s}
			const defaultParams = {
				filter_by: def.filter_by,
				filter_value: def.filter_value,
				filter_comparator: def.filter_comparator,
				filter_concat: def.filter_concat,
				s: s ? def.s : undefined,
			}

			return JSON.stringify(params) !== JSON.stringify(defaultParams)
		},
	},
	watch: {
		modelValue: {
			handler(value) {
				this.value = value
			},
			immediate: true,
		},
	},
	methods: {
		clearFilters() {
			this.value = {...getDefaultParams()}
		},
	},
}
</script>

<style scoped lang="scss">
.filter-popup {
	margin: 0;

	&.is-open {
		margin: 2rem 0 1rem;
	}
}
</style>

<template>
	<nav
		:class="{'has-background': background}"
		aria-label="main navigation"
		class="navbar main-theme is-fixed-top"
		role="navigation"
	>
		<router-link :to="{name: 'home'}" class="logo-link">
			<Logo width="164" height="48"/>
		</router-link>
		<MenuButton class="menu-button"/>
		<div class="list-title" ref="listTitle" v-show="currentList.id">
			<template v-if="currentList.id">
				<h1
					:style="{ 'opacity': currentList.title === '' ? '0': '1' }"
					class="title">
					{{ currentList.title === '' ? $t('misc.loading') : getListTitle(currentList) }}
				</h1>

				<list-settings-dropdown v-if="canWriteCurrentList && currentList.id !== -1" :list="currentList"/>
			</template>
		</div>

		<div class="navbar-end">
			<update/>
			<a
				@click="openQuickActions"
				class="trigger-button pr-0"
				v-shortcut="'Control+k'"
				:title="$t('keyboardShortcuts.quickSearch')"
			>
				<icon icon="search"/>
			</a>
			<notifications/>
			<div class="user">
				<img :src="userAvatar" alt="" class="avatar" width="40" height="40"/>
				<dropdown class="is-right" ref="usernameDropdown">
					<template #trigger>
						<x-button
							type="secondary"
							:shadow="false">
							<span class="username">{{ userInfo.name !== '' ? userInfo.name : userInfo.username }}</span>
							<span class="icon is-small">
								<icon icon="chevron-down"/>
							</span>
						</x-button>
					</template>

					<router-link :to="{name: 'user.settings'}" class="dropdown-item">
						{{ $t('user.settings.title') }}
					</router-link>
					<a
						:href="imprintUrl"
						class="dropdown-item"
						target="_blank"
						rel="noreferrer noopener nofollow"
						v-if="imprintUrl">
						{{ $t('navigation.imprint') }}
					</a>
					<a
						:href="privacyPolicyUrl"
						class="dropdown-item"
						target="_blank"
						rel="noreferrer noopener nofollow"
						v-if="privacyPolicyUrl">
						{{ $t('navigation.privacy') }}
					</a>
					<a @click="$store.commit('keyboardShortcutsActive', true)" class="dropdown-item">
						{{ $t('keyboardShortcuts.title') }}
					</a>
					<router-link :to="{name: 'about'}" class="dropdown-item">
						{{ $t('about.title') }}
					</router-link>
					<a @click="logout()" class="dropdown-item">
						{{ $t('user.auth.logout') }}
					</a>
				</dropdown>
			</div>
		</div>
	</nav>
</template>

<script>
import {mapState} from 'vuex'
import {CURRENT_LIST, QUICK_ACTIONS_ACTIVE} from '@/store/mutation-types'
import Rights from '@/models/constants/rights.json'
import Update from '@/components/home/update.vue'
import ListSettingsDropdown from '@/components/list/list-settings-dropdown.vue'
import Dropdown from '@/components/misc/dropdown.vue'
import Notifications from '@/components/notifications/notifications.vue'
import Logo from '@/components/home/Logo.vue'
import MenuButton from '@/components/home/MenuButton.vue'

export default {
	name: 'topNavigation',
	components: {
		Notifications,
		Dropdown,
		ListSettingsDropdown,
		Update,
		Logo,
		MenuButton,
	},
	computed: {
		...mapState({
			userInfo: state => state.auth.info,
			userAvatar: state => state.auth.avatarUrl,
			userAuthenticated: state => state.auth.authenticated,
			currentList: CURRENT_LIST,
			background: 'background',
			imprintUrl: state => state.config.legal.imprintUrl,
			privacyPolicyUrl: state => state.config.legal.privacyPolicyUrl,
			canWriteCurrentList: state => state.currentList.maxRight > Rights.READ,
		}),
	},
	mounted() {
		this.$nextTick(() => {
			if (typeof this.$refs.usernameDropdown === 'undefined' || typeof this.$refs.listTitle === 'undefined') {
				return
			}

			const usernameWidth = this.$refs.usernameDropdown.$el.clientWidth
			this.$refs.listTitle.style.setProperty('--nav-username-width', `${usernameWidth}px`)
		})
	},
	methods: {
		logout() {
			this.$store.dispatch('auth/logout')
			this.$router.push({name: 'user.login'})
		},
		openQuickActions() {
			this.$store.commit(QUICK_ACTIONS_ACTIVE, true)
		},
	},
}
</script>

<style lang="scss" scoped>
$vikunja-nav-logo-full-width: 164px;
$user-dropdown-width-mobile: 5rem;

$hamburger-menu-icon-spacing: 1rem;
$hamburger-menu-icon-width: 28px;

.navbar {
	z-index: 4 !important;
}

.logo-link {
	display: none;
	padding: 0.5rem 0.75rem;

	@media screen and (min-width: $tablet) {
		align-self: stretch;
		display: flex;
		align-items: center;
		padding-left: 2rem;
		margin-right: 1.5rem;
	}
}

.menu-button {
	align-self: stretch;
	margin-right: auto;

	@media screen and (max-width: $tablet) {
		margin-left: $hamburger-menu-icon-spacing;
	}
}

.navbar.main-theme {
	background: var(--site-background);
	z-index: 5 !important;
	justify-content: space-between;
	align-items: center;

	@media screen and (max-width: $desktop) {
		display: flex;
		justify-content: space-between;
	}

	.title {
		margin: 0;
		font-size: 1.75rem;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}

	.navbar-end {
		margin-left: 0;
		align-items: center;
		display: flex;
	}

	@media screen and (max-width: $tablet) {
		.user {
			width: $user-dropdown-width-mobile;
			display: flex;
			align-items: center;

			:deep(.dropdown-trigger) {
				line-height: 1;

				.button {
					padding: 0 0.25rem;
					height: 1rem;

					.icon {
						width: .5rem;
					}
				}
			}

			.username {
				display: none;
			}
		}
	}
}

.navbar {
	// FIXME: notifications should provide a slot for the icon instead, so that we can style it as we want
	:deep() {
		.trigger-button {
			cursor: pointer;
			color: var(--grey-400);
			padding: .5rem;
			font-size: 1.25rem;
			position: relative;
		}

		> * > .trigger-button {
			width: $navbar-icon-width;
		}
	}

	.user {
		display: flex;
		align-items: center;

		span {
			font-family: $vikunja-font;
		}

		.avatar {
			border-radius: 100%;
			vertical-align: middle;
			height: 40px;
		}

		:deep(.dropdown-trigger .button) {
			background: none;

			&:focus:not(:active), &:active {
				outline: none !important;
				box-shadow: none !important;
			}
		}
	}
}

.list-title {
	display: flex;
	align-items: center;
	justify-content: center;

	$edit-icon-width: 1rem;

	@media screen and (min-width: $tablet) {
		// We need a fixed width for overflowing ellipsis to work
		--nav-username-width: 0;
		width: calc(100vw - #{$user-dropdown-width-mobile} - #{2 * $hamburger-menu-icon-spacing} - #{$hamburger-menu-icon-width} - #{$edit-icon-width} - #{2 * $navbar-icon-width} - #{$vikunja-nav-logo-full-width} - var(--nav-username-width));
	}

	@media screen and (max-width: $tablet) {
		// We need a fixed width for overflowing ellipsis to work
		width: calc(100vw - #{$user-dropdown-width-mobile} - #{2 * $hamburger-menu-icon-spacing} - #{$hamburger-menu-icon-width} - #{$edit-icon-width} - #{2 * $navbar-icon-width});
	}

	h1 {
		margin: 0;
	}

	:deep(.dropdown-trigger) {
		color: var(--grey-400);
		margin-left: 1rem;
		height: 1rem;
		width: 1rem;
		cursor: pointer;
	}
}
</style>
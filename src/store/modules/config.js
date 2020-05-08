import {CONFIG} from '../mutation-types'
import {HTTP} from '../../http-common'

export default {
	namespaced: true,
	state: () => ({
		// These are the api defaults.
		version: '',
		frontendUrl: '',
		motd: '',
		linkSharingEnabled: true,
		maxFileSize: '20MB',
		registrationEnabled: true,
		availableMigrators: [],
		taskAttachmentsEnabled: true,
	}),
	mutations: {
		[CONFIG](state, config) {
			state.version = config.version
			state.frontendUrl = config.frontend_url
			state.motd = config.motd
			state.linkSharingEnabled = config.link_sharing_enabled
			state.maxFileSize = config.max_file_size
			state.registrationEnabled = config.registration_enabled
			state.availableMigrators = config.available_migrators
			state.taskAttachmentsEnabled = config.task_attachments_enabled
		},
	},
	actions: {
		update(ctx) {
			HTTP.get('info')
				.then(r => {
					ctx.commit(CONFIG, r.data)
				})
		},
	},
}
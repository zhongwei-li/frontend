import AbstractModel from "./abstractModel";

export default class LabelTask extends AbstractModel {
	defaults() {
		return {
			id: 0,
			taskID: 0,
			label_id: 0,
		}
	}
}
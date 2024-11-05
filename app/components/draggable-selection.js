import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import moment from 'moment';

export default class DraggableSelectionComponent extends Component {
  @service('sweet-alert') alert;
  @service('utility-methods') utils;
  @service('current-user') currentUser;

  @tracked isExpanded = false;
  @tracked isDragging = false;

  get workspaceType() {
    return this.args.selection.workspace.get('workspaceType');
  }

  get isParentWorkspace() {
    return this.workspaceType === 'parent';
  }

  get canDelete() {
    const currentUserId = this.currentUser.user.id;
    const creatorId = this.args.selection.createdBy.id;
    return currentUserId === creatorId || this.args.canDeleteSelections;
  }

  get isImage() {
    const imageTagLink = this.args.selection.imageTagLink;
    return imageTagLink ? imageTagLink.length > 0 : false;
  }

  get linkToClassName() {
    return this.isImage ? 'selection-image' : 'selection_text';
  }

  get isSelected() {
    return this.args.selection?.id === this.args.currentSelection?.id;
  }

  get isVmtClip() {
    const { startTime, endTime } = this.args.selection.vmtInfo || {};
    return startTime >= 0 && endTime >= 0;
  }

  get titleText() {
    if (!this.isVmtClip) {
      const createDate = this.args.selection.createDate;
      const displayDate = moment(createDate).format('l h:mm');
      return `Created ${displayDate}`;
    }
    const { startTime, endTime } = this.args.selection.vmtInfo;
    return `${this.utils.getTimeStringFromMs(
      startTime
    )} - ${this.utils.getTimeStringFromMs(endTime)}`;
  }

  get overlayIcon() {
    if (!this.isImage) {
      return '';
    }
    return this.isVmtClip ? 'fas fa-play' : 'fas fa-expand';
  }

  @action
  dragStart(event) {
    const dataTransfer = event.dataTransfer;
    const data = JSON.stringify(this.args.selection);
    const dataWithId = `{"id": "${this.args.selection.id}",${data.substring(
      1
    )}`;
    dataTransfer.setData('application/json', dataWithId);
    dataTransfer.setData('text/plain', 'selection');
    this.isDragging = true;
  }

  @action
  dragEnd() {
    this.isDragging = false;
  }

  @action
  deleteSelection() {
    this.alert
      .showModal(
        'warning',
        'Are you sure you want to delete this selection?',
        null,
        'Yes, delete it'
      )
      .then((result) => {
        if (result.value) {
          this.args.deleteSelection(this.args.selection);
        }
      });
  }

  @action
  expandImage() {
    if (!this.isVmtClip) {
      this.isExpanded = !this.isExpanded;
    }
  }

  // Add the draggable attribute directly
  get draggable() {
    return 'true';
  }

  @action
  setupDrag(event) {
    const dataTransfer = event.dataTransfer;
    dataTransfer.setData('text/plain', this.elementId);
  }
}

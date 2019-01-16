/*global _:false */
Encompass.WorkspaceInfoCollaboratorsComponent = Ember.Component.extend(Encompass.CurrentUserMixin, {
  elementId: ['workspace-info-collaborators'],
  utils: Ember.inject.service('utility-methods'),
  alert: Ember.inject.service('sweet-alert'),
  mainPermissions: [
    {
      id: 1,
      display: 'Hidden',
      value: 0,
    },
    {
      id: 2,
      display: 'View Only',
      value: 1,
    },
    {
      id: 3,
      display: 'Create',
      value: 2,
    },
    {
      id: 4,
      display: 'Add',
      value: 3,
    },
    {
      id: 5,
      display: 'Delete',
      value: 4,
    },
  ],
  feedbackPermissions: [
    {
      id: 1,
      display: 'None',
      value: 'none',
    },
    {
      id: 2,
      display: 'Authorization Required',
      value: 'authReq',
    },
    {
      id: 3,
      display: 'Pre-Authorized',
      value: 'preAuth',
    },
  ],
  submissionPermissions: [
    {
      id: 1,
      display: 'All',
      value: 'all',
    },
    {
      id: 2,
      display: 'Own Only',
      value: 'userOnly',
    },
    {
      id: 3,
      display: 'Custom',
      value: 'custom',
    },
  ],

  modes: function () {
    const basic = ['private', 'org', 'public'];

    if (this.get('currentUser.isStudent') || !this.get('currentUser.isAdmin')) {
      return basic;
    }

    return ['private', 'org', 'public', 'internet'];

  }.property('currentUser.isAdmin', 'currentUser.isStudent'),

  workspacePermissions: function() {
    let permissions = this.get('workspace.permissions');
    let collabs = this.get('originalCollaborators');

    if (!this.get('utils').isNonEmptyArray(permissions)) {
      return [];
    }
    //for each permissions object replace the userId with the user object
    //start with array of object and return array of objects
    if (this.get('utils').isNonEmptyArray(collabs)) {
      return permissions.map((permission) => {
        permission.userObj = this.get('store').peekRecord('user', permission.user);
        return permission;
      });
    }
    return [];

  }.property('workspace.permissions.[]', 'originalCollaborators.[]'),

  createValueObject(val) {
    let obj = {
      id: null,
      display: null,
      value: val,
    };
    switch (val) {
      case 0:
        obj.display = 'Hidden';
        obj.id = 1;
        break;
      case 1:
        obj.display = 'View Only';
        obj.id = 2;
        break;
      case 2:
        obj.display = 'Create';
        obj.id = 3;
        break;
      case 3:
        obj.display = 'Add';
        obj.id = 4;
        break;
      case 4:
        obj.display = 'Delete';
        obj.id = 5;
        break;
      case 'none':
        obj.display = 'None';
        obj.id = 1;
        break;
      case 'authRea':
        obj.display = 'Authorization Required';
        obj.id = 2;
        break;
      case 'preAuth':
        obj.display = 'Pre-Authorized';
        obj.id = 3;
        break;
      default:
        break;
    }
    return obj;
  },

  createSubmissionValueObject(subObj) {
    let obj = {
      id: null,
      display: null,
      value: null,
    };
    if (subObj.all) {
      obj.id = 1;
      obj.value = 'all';
      obj.display = 'All';
    } else {
      obj.id = 3;
      obj.value = 'custom';
      obj.display = 'Custom';
      this.set('customSubIds', subObj.submissionIds);
    }
    return obj;
  },

  actions: {
    editCollab: function (collaborator) {
      this.set('isEditing', true);
      if (!this.get('utils').isNonEmptyObject(collaborator)) {
        return;
      }
      this.set('selectedCollaborator', collaborator.userObj);
      let submissions = this.createSubmissionValueObject(collaborator.submissions);
      let selections = this.createValueObject(collaborator.selections);
      let comments = this.createValueObject(collaborator.comments);
      let folders = this.createValueObject(collaborator.folders);
      let feedback = this.createValueObject(collaborator.feedback);
      this.set('submissions', submissions);
      this.set('selections', selections);
      this.set('comments', comments);
      this.set('folders', folders);
      this.set('feedback', feedback);
    },

    savePermissions(permissionsObject) {
      const ws = this.get('workspace');
      if (!this.get('utils').isNonEmptyObject(permissionsObject)) {
        return;
      }
      const permissions = this.get('workspace.permissions');
      let existingObj = permissions.findBy('user', permissionsObject.user);

      if (existingObj) {
        permissions.removeObject(existingObj);
      }

      let viewAllSubs;
      let submissionIds = existingObj.submissions.submissionIds;
      if (this.get('submissions.value') === 'all' ) {
        viewAllSubs = true;
      } else {
        viewAllSubs = false;
      }

      let newObj = {
        user: existingObj.user,
        submissions: { all: viewAllSubs, submissionIds: submissionIds },
        selections: this.get('selections.value'),
        folders: this.get('folders.value'),
        comments: this.get('comments.value'),
        feedback: this.get('feedback.value'),
      };

      permissions.addObject(newObj);

      ws.save().then(() => {
        this.get('alert').showToast('success', `Permissions set for ${permissionsObject.userObj.get('username')}`, 'bottom-end', 3000, null, false);
        this.set('selectedCollaborator', null);
      });
    },

    removeCollab(user) {
      let workspace = this.get('workspace');
      const utils = this.get('utils');
      if (!utils.isNonEmptyObject(user)) {
        return;
      }
      const permissions = this.get('workspace.permissions');

      if (utils.isNonEmptyArray(permissions)) {
        const objToRemove = permissions.findBy('user', user.get('id'));
        if (objToRemove) {
          this.get('alert').showModal('warning', `Are you sure you want to remove ${user.get('username')} as a collaborator?`, `This may affect their ability to access ${this.get('workspace.name')} `, 'Yes, remove')
        .then((result) => {
          if (result.value) {
            permissions.removeObject(objToRemove);
            const collaborators = this.get('originalCollaborators');
            collaborators.removeObject(user);
            workspace.save().then(() => {
              this.get('alert').showToast('success', `${user.get('username')} removed`, 'bottom-end', 3000, null, false);
            });
          }
        });
        }
      }
    },
  }
});

import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import moment from 'moment';

export default class UserInfoComponent extends Component {
  @service('sweet-alert') alert;
  @service('utility-methods') utils;
  @service('error-handling') errorHandling;
  @service('edit-permissions') basePermissions;
  @service store;

  @tracked isEditing = false;
  @tracked authorized = null;
  @tracked selectedType = null;
  @tracked willOveride = null;
  @tracked fieldType = 'password';
  @tracked loadOrgsErrors = [];
  @tracked updateRecordErrors = [];
  @tracked createRecordErrors = [];
  @tracked findRecordErrors = [];
  @tracked isResettingPassword = false;

  get canEdit() {
    let user = this.args.user;
    let currentUser = this.args.currentUser;
    if (!user || !currentUser) {
      return false;
    }

    // is Admin
    if (this.args.currentUser.accountType === 'A') {
      return true;
    }

    // is self
    if (user.get('id') === currentUser.get('id')) {
      return true;
    }

    let creatorId = this.utils.getBelongsToId(user, 'createdBy');

    // is creator
    if (currentUser.get('id') === creatorId) {
      return true;
    }

    // pd admin for user's org
    if (this.basePermissions.isRecordInPdDomain(user)) {
      return true;
    }
    return false;
  }

  get canConfirm() {
    if (this.basePermissions.isActingAdmin) {
      return true;
    }
    if (this.basePermissions.isRecordInPdDomain(this.args.user)) {
      return true;
    }
    return false;
  }

  get unconfirmedEmail() {
    return !this.args.user.isEmailConfirmed;
  }

  get accountTypes() {
    let accountType = this.args.currentUser.get('accountType');
    let accountTypes;

    if (accountType === 'A') {
      accountTypes = ['Teacher', 'Student', 'Pd Admin', 'Admin'];
    } else if (accountType === 'P') {
      accountTypes = ['Teacher', 'Student'];
    } else if (accountType === 'T') {
      accountTypes = ['Student'];
    } else {
      accountTypes = [];
    }

    return accountTypes;
  }

  get tourDate() {
    var date = this.seenTour;
    if (date) {
      return moment(date).fromNow();
    }
    return 'no';
  }

  @action editUser() {
    let user = this.args.user;
    this.userEmail = user.email;

    let accountType = user.get('accountType');
    if (accountType === 'S') {
      this.selectedType = 'Student';
    } else if (accountType === 'T') {
      this.selectedType = 'Teacher';
    } else if (accountType === 'A') {
      this.selectedType = 'Admin';
    } else if (accountType === 'P') {
      this.selectedType = 'Pd Admin';
    } else {
      this.selectedType = null;
    }
    this.isEditing = true;
    let isAuth = user.get('isAuthorized');
    this.authorized = isAuth;
  }

  @action checkOrgExists() {
    let user = this.args.user;
    let userOrg = user.get('organization.content');
    let userOrgRequest = user.get('organizationRequest');
    let org = this.org;
    let orgReq = this.orgReq;

    let options = [
      Boolean(userOrg),
      Boolean(userOrgRequest),
      Boolean(org),
      Boolean(orgReq),
    ];

    if (options.includes(true)) {
      this.saveUser();
    } else {
      this.alert
        .showModal(
          'warning',
          'Are you sure you want to save a user that has no organization?',
          'Users should belong to an organization to improve the EnCoMPASS experience',
          'Yes'
        )
        .then((result) => {
          if (result.value) {
            this.saveUser();
          }
        });
    }
  }

  saveUser() {
    let currentUser = this.args.currentUser;
    let user = this.args.user;
    let org = this.org;
    let orgReq = this.orgReq;

    let orgs = this.args.orgList;
    let matchingOrg = orgs.findBy('name', orgReq);
    if (matchingOrg) {
      org = matchingOrg;
      orgReq = null;
    }

    // should we check to see if any information was actually updated before updating modified by/date?
    let accountType = this.selectedType;
    let accountTypeLetter = accountType.charAt(0).toUpperCase();
    user.set('accountType', accountTypeLetter);

    if (org) {
      user.set('organization', org);
    }
    if (orgReq) {
      user.set('organizationRequest', orgReq);
    }
    user.set('email', this.userEmail);

    //if is authorized is now true, then we need to set the value of authorized by to current user
    let newDate = new Date();
    user.set('lastModifiedBy', currentUser);
    user.set('lastModifiedDate', newDate);

    // so server knows whether to make request to sso server
    user.set('isConfirmingEmail', this.isConfirmingEmail);

    user
      .save()
      .then(() => {
        this.alert.showToast(
          'success',
          'User updated',
          'bottom-end',
          3000,
          false,
          null
        );
        this.isEditing = false;
        this.errorHandling.removeMessages('updateRecordErrors');
      })
      .catch((err) => {
        this.errorHandling.handleErrors(err, 'updateRecordErrors', user);
      });
    this.isEditing = false;
  }

  @action initSave() {
    return this.saveUser();
  }

  @action setOrg(org) {
    if (typeof org === 'string') {
      this.orgReq = org;
    } else {
      this.org = org;
    }
  }

  @action resetPassword() {
    this.isResettingPassword = true;
  }

  @action authEmail() {
    this.willOveride = true;
  }

  @action confirmOrgModal() {
    let user = this.args.user;
    let reqOrg = user.get('organizationRequest');
    this.alert
      .showModal(
        'question',
        `Are you sure you want to create a new organization?`,
        `This will create a brand new organization called ${reqOrg}`,
        'Yes'
      )
      .then((result) => {
        if (result.value) {
          this.send('createNewOrg');
        }
      });
  }

  @action createNewOrg() {
    let user = this.args.user;
    let currentUser = this.args.currentUser;
    let reqOrg = user.get('organizationRequest');
    let newOrg = this.store.createRecord('organization', {
      name: reqOrg,
      createdBy: currentUser,
    });
    newOrg
      .save()
      .then((org) => {
        this.errorHandling.removeMessages('createRecordErrors');
        let user = this.args.user;
        let orgName = org.get('name');
        user.set('organization', org);
        this.orgReq = null;
        user.set('organizationRequest', null);
        user
          .save()
          .then((user) => {
            this.alert.showToast(
              'success',
              `${orgName} Created`,
              'bottom-end',
              3000,
              false,
              null
            );
            this.orgModal = false;
            this.errorHandling.removeMessages('updateRecordErrors');
          })
          .catch((err) => {
            this.errorHandling.handleErrors(err, 'updateRecordErrors', user);
          });
      })
      .catch((err) => {
        this.errorHandling.handleErrors(err, 'createRecordErrors', newOrg);
      });
  }

  @action removeOrg() {
    let user = this.args.user;
    user.set('organizationRequest', null);
    user
      .save()
      .then((res) => {
        // handle success
        this.errorHandling.removeMessages('updateRecordErrors');
      })
      .catch((err) => {
        this.errorHandling.handleErrors(err, 'updateRecordErrors', user);
      });
  }

  @action deleteUser() {
    let user = this.args.user;
    let username = user.get('username');
    this.alert
      .showModal(
        'warning',
        `Are you sure want to delete ${username}?`,
        'You can always restore this user later',
        'Delete'
      )
      .then((result) => {
        if (result.value) {
          user.isTrashed = true;
          user.save().then(() => {
            this.alert
              .showToast(
                'success',
                `${username} successfully deleted`,
                'bottom-end',
                4000,
                true,
                'Undo'
              )
              .then((result) => {
                if (result.value) {
                  user.set('isTrashed', false);
                  user.save().then(() => {
                    this.alert.showToast(
                      'success',
                      `${username} successfully restored`,
                      'bottom-end',
                      3000,
                      false,
                      null
                    );
                  });
                }
              });
          });
        }
      });
  }

  @action restoreUser() {
    let user = this.args.user;
    let username = user.get('username');
    this.alert
      .showModal(
        'question',
        `Are you sure want to restore ${username}?`,
        null,
        'Yes'
      )
      .then((result) => {
        if (result.value) {
          user.set('isTrashed', false);
          user.save().then(() => {
            this.alert.showToast(
              'success',
              `${username} successfully restored`,
              'bottom-end',
              4000,
              true,
              'Undo'
            );
          });
        }
      });
  }

  @action cancel() {
    this.isEditing = false;
    this.noOrgModal = false;
    this.isResettingPassword = false;
  }

  @action handleCancelForm() {
    this.isResettingPassword = false;
  }

  @action handleResetSuccess(updatedUser) {
    this.isResettingPassword = false;
    this.resetPasswordSuccess = true;
    this.errorHandling.removeMessages('findRecordErrors');
    this.args.refresh();
  }

  @action clearTour() {
    this.args.user.seenTour = null;
  }

  @action doneTour() {
    this.args.user.seenTour = new Date();
  }
  @action onManualConfirm() {
    // clicked manual confirm email box
    let user = this.args.user;

    if (user) {
      let isConfirmingEmail = !user.get('isEmailConfirmed');

      this.isConfirmingEmail = isConfirmingEmail;
      user.toggleProperty('isEmailConfirmed');
    }
  }
}

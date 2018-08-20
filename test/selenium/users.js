// REQUIRE MODULES
const {Builder, By, Key, until} = require('selenium-webdriver')
const expect = require('chai').expect;

// REQUIRE FILES
const helpers = require('./helpers');
const dbSetup = require('../data/restore');
const css = require('./selectors');

const host = helpers.host;


describe('Users', function() {
  this.timeout(helpers.timeoutTestMsStr);
  let driver = null;
  before(async function() {
    driver = new Builder()
      .forBrowser('chrome')
      .build();
    await dbSetup.prepTestDb();
  });

  after(() => {
    driver.quit();
  });

  describe('Logged in as an admin user', function () {
    before(async function () {
      // await helpers.findAndClickElement(driver, css.topBar.logout);
      // await helpers.waitForSelector(driver, css.topBar.login);
      await helpers.login(driver, host);
      await helpers.waitForSelector(driver, css.topBar.users);
    });

    function validateUsersPage() {
      it('should show/hide various editable fields', async function () {
        const inputs = ['input.user-email', 'input.user-name', 'input.user-location'];
        expect(await helpers.isTextInDom(driver, helpers.admin.username)).to.be.true;

        await helpers.findAndClickElement(driver, 'button.edit-user');

        // should there be an input to change username?
        for (let input of inputs) {
          expect(await helpers.isElementVisible(driver, input)).to.be.true;
        }
        await helpers.findAndClickElement(driver, 'button.saveUser');
      });
    }

    function validateNewUserPage() {
      it('should display the page title and form', async function () {
        expect(await helpers.isTextInDom(driver, 'Create New User')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'article.user')).to.be.true;
      });

      it('should show certain fields', async function () {
        expect(await helpers.isElementVisible(driver, 'input.user-username')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'input.user-password')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'input.user-name')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'input.user-email')).to.be.true;
        expect(await helpers.isElementVisible(driver, '#organization')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'input.user-location')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'select')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'input.user-isAuth')).to.be.true;
      });

      it('should not let you submit form with missing fields', async function () {
        let username = `muzzy`;
        await helpers.findInputAndType(driver, 'input.user-username', username);
        await helpers.selectOption(driver, 'my-select', 'T');
        await helpers.findAndClickElement(driver, 'button.new-user');
        await helpers.waitForSelector(driver, '.error-message');
        expect(await helpers.findAndGetText(driver, '.error-message')).to.contain('Missing required fields');
      });

      it('should let you create a new unauthorized pdadmin', async function () {
        let password = `test`;
        let name = `Muzzy Doe`;
        let email = `mdoe@gmail.com`;
        let organization = `Drexel University`;
        let location = `Philadelphia, PA`;
        await helpers.selectOption(driver, 'my-select', 'P');
        await helpers.findInputAndType(driver, 'input.user-password', password);
        await helpers.findInputAndType(driver, 'input.user-name', name);
        await helpers.findInputAndType(driver, 'input.user-email', email);
        await helpers.findInputAndType(driver, 'input#organization', organization);
        await helpers.findInputAndType(driver, 'input.user-location', location);
        await helpers.findAndClickElement(driver, 'button#new-user-btn');
        await helpers.waitForSelector(driver, '#user-info');
        await driver.sleep('1000');
        expect(await helpers.findAndGetText(driver, 'ul.waiting-auth>li:first-child')).to.contain('muzzy');
      });

      it('should let you create a new authorized teacher', async function () {
        let username = `msmith`;
        let password = `test`;
        let name = `John Doe`;
        let oldEmail = `mdoe@gmail.com`;
        let newEmail = `msmith@gmail.com`;
        let organization = `Drexel University`;
        let location = `Philadelphia, PA`;
        await helpers.findAndClickElement(driver, '#new-user-link');
        await helpers.waitForSelector(driver, 'div#user-new-admin');
        await helpers.findInputAndType(driver, 'input.user-username', username);
        await helpers.findInputAndType(driver, 'input.user-password', password);
        await helpers.findInputAndType(driver, 'input.user-name', name);
        await helpers.findInputAndType(driver, 'input.user-email', oldEmail);
        await helpers.findInputAndType(driver, 'input#organization', organization);
        await helpers.findInputAndType(driver, 'input.user-location', location);
        await helpers.selectOption(driver, 'my-select', 'T');
        await helpers.findAndClickElement(driver, 'input.user-isAuth');
        await helpers.findAndClickElement(driver, 'button.new-user');
        await helpers.waitForSelector(driver, '.error-message');
        expect(await helpers.findAndGetText(driver, '.error-message')).to.contain('Email address has already been used');
        await helpers.clearElement(driver, 'input.user-email');
        await helpers.findInputAndType(driver, 'input.user-email', newEmail);
        await helpers.findAndClickElement(driver, '#new-user-btn');
        await helpers.waitForSelector(driver, '#user-info');
        expect(await helpers.findAndGetText(driver, 'ul.teacher-users>li:first-child')).to.contain('msmith');
      });
      //check to make sure the user info page has the info

      it('should let you create a new student without an email', async function () {
        let oldUsername = `student1`;
        let newUsername = `newStudent`;
        let password = `test`;
        let name = `Student Doe`;
        let organization = `Drexel University`;
        await helpers.findAndClickElement(driver, '#new-user-link');
        await helpers.waitForSelector(driver, 'div#user-new-admin');
        await helpers.findInputAndType(driver, 'input.user-username', oldUsername);
        await helpers.findInputAndType(driver, 'input.user-password', password);
        await helpers.findInputAndType(driver, 'input.user-name', name);
        await helpers.findInputAndType(driver, 'input#organization', organization);
        await helpers.selectOption(driver, 'my-select', 'S');
        await helpers.findAndClickElement(driver, 'input.user-isAuth');
        await helpers.findAndClickElement(driver, 'button.new-user');
        await helpers.waitForSelector(driver, '.error-message');
        expect(await helpers.findAndGetText(driver, '.error-message')).to.contain('Username already exists');
        await helpers.clearElement(driver, 'input.user-username');
        await helpers.findInputAndType(driver, 'input.user-username', newUsername);
        await helpers.findAndClickElement(driver, 'button.new-user');
        await helpers.waitForSelector(driver, '#user-info');
        expect(await helpers.findAndGetText(driver, 'ul.student-users>li:first-child')).to.contain('newStudent');
      });

    }

    function changeAuth() {
      it('should authorize a new user', async function () {
        await helpers.findAndClickElement(driver, 'button.edit-user');
        await helpers.findAndClickElement(driver, 'input.user-isAuth');
        await helpers.findAndClickElement(driver, 'button.save-user');
        await helpers.waitForSelector(driver, '#user-info');
        expect(await helpers.findAndGetText(driver, 'ul.pd-users>li:first-child')).to.contain('muzzy');
      });
    }

    function changeAccountType() {
      it('should change a teacher to an admin', async function () {
        await helpers.findAndClickElement(driver, 'button.edit-user');
        await helpers.findAndClickElement(driver, 'input.user-isAuth');
        await helpers.selectOption(driver, 'my-select', 'A');
        await helpers.findAndClickElement(driver, 'button.save-user');
        await helpers.waitForSelector(driver, '#user-info');
        expect(await helpers.findAndGetText(driver, 'ul.admin-users>li:first-child')).to.contain('nope');
      });
    }

    function confirmEmail() {
      it('should manually confirm email', async function () {
        await helpers.findAndClickElement(driver, 'button.edit-user');
        await helpers.findAndClickElement(driver, 'input.user-email-auth');
        await helpers.findAndClickElement(driver, 'button.save-user');
        await helpers.waitForSelector(driver, '#user-info');
        await driver.sleep('2000');
        expect(await helpers.findAndGetText(driver, 'td.is-email-confirm')).to.contain('true');
      });
    }

    describe('Visiting the users list home page', function () {
      before(async function () {
        await helpers.navigateAndWait(driver, `${host}/#/users/home`, '#user-home');
      });

      it('should display a welcome page', async function () {
        await helpers.waitForSelector(driver, '#user-home');
      });

      it('should have a create new user link', async function () {
        await helpers.findAndClickElement(driver, `a[href="users/new"]`);
      });

      it('should display a list with your account', async function () {
        expect(await helpers.getWebElements(driver, 'ul.your-account>li')).to.have.lengthOf.at.least(1);
        expect(await helpers.findAndGetText(driver, 'ul.your-account>li:first-child')).to.contain('rick');
      });

      it('should have a list of users waiting for authorization', async function () {
        expect(await helpers.getWebElements(driver, 'ul.waiting-auth>li')).to.have.lengthOf.at.least(2);
        expect(await helpers.findAndGetText(driver, 'ul.waiting-auth>li:first-child')).to.contain('nope');
      });

      it('should have a list of admins', async function () {
        expect(await helpers.getWebElements(driver, 'ul.admin-users>li')).to.have.lengthOf.at.least(6);
        expect(await helpers.findAndGetText(driver, 'ul.admin-users>li:first-child')).to.contain('superuser');
      });

      it('should have a list of pd admins', async function () {
        expect(await helpers.getWebElements(driver, 'ul.pd-users>li')).to.have.lengthOf.at.least(1);
        expect(await helpers.findAndGetText(driver, 'ul.pd-users>li:first-child')).to.contain('pdadmin');
      });

      it('should have a list of teachers', async function () {
        expect(await helpers.getWebElements(driver, 'ul.teacher-users>li')).to.have.lengthOf.at.least(11);
        expect(await helpers.findAndGetText(driver, 'ul.teacher-users>li:first-child')).to.contain('morty');
      });

      it('should have a list of students', async function () {
        expect(await helpers.getWebElements(driver, 'ul.student-users>li')).to.have.lengthOf.at.least(1);
        expect(await helpers.findAndGetText(driver, 'ul.student-users>li:first-child')).to.contain('student1');
      });

      describe('clicking on your own account', function () {
        before(async function () {
          await helpers.findAndClickElement(driver, `a[href$="#/users/${helpers.admin.username}"]`);
          await helpers.waitForSelector(driver, 'div#user-info');
        });
        validateUsersPage();
      });

      describe('clicking the Create New User link', function () {
        before(async function () {
          await helpers.findAndClickElement(driver, '#new-user-link');
          await helpers.waitForSelector(driver, 'div#user-new-admin');
        });
        validateNewUserPage();
      });

      describe('authorizing a user', function () {
        before(async function () {
          await helpers.findAndClickElement(driver, `a[href$="#/users/muzzy"]`);
        });
        changeAuth();
      });

      describe("changing a user's account type", function () {
        before(async function () {
          await helpers.findAndClickElement(driver, `a[href$="#/users/nope"]`);
        });
        changeAccountType();
      });

      describe('manually authorize a users email', function () {
        before(async function () {
          await helpers.findAndClickElement(driver, `a[href$="#/users/superuser"]`);
        });
        confirmEmail();
      });

    });
  });

  describe('Logged in as a pd admin user', function () {
    before(async function () {
      await helpers.findAndClickElement(driver, css.topBar.logout);
      await helpers.login(driver, host, helpers.pdAdmin);
      await helpers.findAndClickElement(driver, css.topBar.users);
    });

    function validateUsersPage() {
      it('should show/hide various editable fields', async function () {
        const inputs = ['input.user-email', 'input.user-name', 'input.user-location'];
        expect(await helpers.isTextInDom(driver, helpers.pdAdmin.username)).to.be.true;

        await helpers.findAndClickElement(driver, 'button.edit-user');
        // should there be an input to change username?
        for (let input of inputs) {
          expect(await helpers.isElementVisible(driver, input)).to.be.true;
        }
        await helpers.findAndClickElement(driver, 'button.save-user');
      });
    }

    function validateNewUserPage() {
      it('should display the page title and form', async function () {
        expect(await helpers.isTextInDom(driver, 'Create New User')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'article.user')).to.be.true;
      });

      it('should show certain fields', async function () {
        expect(await helpers.isElementVisible(driver, 'input.user-username')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'input.user-password')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'input.user-name')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'input.user-email')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'input.user-location')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'select')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'input.user-isAuth')).to.be.true;
      });

      it('should not let you submit form with missing fields', async function () {
        let username = `bunny`;
        await helpers.findInputAndType(driver, 'input.user-username', username);
        await helpers.selectOption(driver, 'my-select', 'T');
        await helpers.findAndClickElement(driver, 'button.user-new');
        await helpers.waitForSelector(driver, '.error-message');
        expect(await helpers.findAndGetText(driver, '.error-message')).to.contain('Missing required fields');
      });

      it('should let you create a new unauthorized teacher', async function () {
        let password = `test`;
        let name = `Bunny Doe`;
        let email = `bdoe@gmail.com`;
        let location = `Philadelphia, PA`;
        await helpers.selectOption(driver, 'my-select', 'T');
        await helpers.findInputAndType(driver, 'input.user-password', password);
        await helpers.findInputAndType(driver, 'input.user-name', name);
        await helpers.findInputAndType(driver, 'input.user-email', email);
        await helpers.findInputAndType(driver, 'input.user-location', location);
        await helpers.findAndClickElement(driver, 'button.user-new');
        await helpers.waitForSelector(driver, '#user-info');
        await driver.sleep('1000');
        expect(await helpers.findAndGetText(driver, 'ul.waiting-auth>li:first-child')).to.contain('bunny');
      });

      it('should let you create a new authorized student', async function () {
        let oldUsername = `bunny`;
        let username = `beyonce`;
        let password = `test`;
        let name = `Beyonce`;
        await helpers.findAndClickElement(driver, '#new-user-link');
        await helpers.waitForSelector(driver, 'div#user-new');
        await helpers.selectOption(driver, 'my-select', 'Student');
        await helpers.findInputAndType(driver, 'input.user-username', oldUsername);
        await helpers.findInputAndType(driver, 'input.user-password', password);
        await helpers.findInputAndType(driver, 'input.user-name', name);
        await helpers.findAndClickElement(driver, 'input.user-isAuth');
        await helpers.findAndClickElement(driver, '#new-user-btn');
        await helpers.waitForSelector(driver, '.error-message');
        expect(await helpers.findAndGetText(driver, '.error-message')).to.contain('Username already exists');
        await helpers.clearElement(driver, 'input.user-username');
        await helpers.findInputAndType(driver, 'input.user-username', username);
        await helpers.findAndClickElement(driver, '#new-user-btn');
        driver.sleep('1000');
        await helpers.waitForSelector(driver, '#user-info');
        expect(await helpers.findAndGetText(driver, 'ul.student-users>li:first-child')).to.contain('beyonce');
      });

    }

    function changeAuth() {
      it('should authorize a new user', async function () {
        await helpers.findAndClickElement(driver, 'button.edit-user');
        await helpers.findAndClickElement(driver, 'input.user-isAuth');
        await helpers.findAndClickElement(driver, 'button.save-user');
        await helpers.waitForSelector(driver, '#user-info');
        expect(await helpers.findAndGetText(driver, 'ul.teacher-users>li:first-child')).to.contain('bunny');
      });
    }

    function changeAccountType() {
      it('should change a teacher to a student', async function () {
        await helpers.findAndClickElement(driver, 'button.edit-user');
        await helpers.selectOption(driver, 'my-select', 'S');
        await helpers.findAndClickElement(driver, 'button.save-user');
        await helpers.waitForSelector(driver, '#user-info');
      });
    }

    function confirmEmail() {
      it('should manually confirm email', async function () {
        await helpers.findAndClickElement(driver, 'button.edit-user');
        await helpers.findAndClickElement(driver, 'input.user-email-auth');
        await helpers.findAndClickElement(driver, 'button.save-user');
        await helpers.waitForSelector(driver, '#user-info');
        await driver.sleep('2000');
        expect(await helpers.findAndGetText(driver, 'td.is-email-confirm')).to.contain('true');
      });
    }

    describe('Visiting the users list home page', function () {
      before(async function () {
        await helpers.navigateAndWait(driver, `${host}/#/users/home`, '#user-home');
      });

      it('should display a welcome page', async function () {
        await helpers.waitForSelector(driver, '#user-home');
      });

      it('should have a create new user link', async function () {
        await helpers.findAndClickElement(driver, `a[href="users/new"]`);
      });

      it('should display a list with your account', async function () {
        expect(await helpers.getWebElements(driver, 'ul.your-account>li')).to.have.lengthOf.at.least(1);
        expect(await helpers.findAndGetText(driver, 'ul.your-account>li:first-child')).to.contain('pdadmin');
      });

      it('should have a list of users waiting authorization', async function () {
        expect(await helpers.getWebElements(driver, 'ul.waiting-auth>li')).to.have.lengthOf.at.least(1);
        expect(await helpers.findAndGetText(driver, 'ul.waiting-auth>li:first-child')).to.contain('wes');
      });

      it('should have a list of teachers', async function () {
        expect(await helpers.getWebElements(driver, 'ul.teacher-users>li')).to.have.lengthOf.at.least(5);
        expect(await helpers.findAndGetText(driver, 'ul.teacher-users>li:first-child')).to.contain('msmith');
      });

      it('should have a list of students', async function () {
        expect(await helpers.getWebElements(driver, 'ul.student-users>li')).to.have.lengthOf.at.least(3);
        expect(await helpers.findAndGetText(driver, 'ul.student-users>li:first-child')).to.contain('newStudent');
      });

      describe('clicking on your own account', function () {
        before(async function () {
          await helpers.findAndClickElement(driver, `a[href$="#/users/${helpers.pdAdmin.username}"]`);
          await helpers.waitForSelector(driver, 'div#user-info');
        });
        validateUsersPage();
      });

      describe('clicking the Create New User link', function () {
        before(async function () {
          await helpers.findAndClickElement(driver, '#new-user-link');
          await helpers.waitForSelector(driver, 'div#user-new');
        });
        validateNewUserPage();
      });

      describe('authorizing a user', function () {
        before(async function () {
          await helpers.findAndClickElement(driver, `a[href$="#/users/bunny"]`);
        });
        changeAuth();
      });

     describe("changing a user's account type", function () {
        before(async function () {
          await helpers.findAndClickElement(driver, `a[href$="#/users/eeyore"]`);
        });
        changeAccountType();
      });

      describe('manually authorize a users email', function () {
        before(async function () {
          await helpers.findAndClickElement(driver, `a[href$="#/users/perryu"]`);
        });
        confirmEmail();
      });

    });
  });

  describe('Logged in as a teacher', function() {
    before(async function() {
      await helpers.findAndClickElement(driver, css.topBar.logout);
      await helpers.login(driver, host, helpers.regUser);
      await helpers.findAndClickElement(driver, css.topBar.users);
    });

    function validateUsersPage() {
      it('should show/hide various editable fields', async function () {
        const inputs = ['input.user-name', 'input.user-location'];
        expect(await helpers.isTextInDom(driver, helpers.pdAdmin.username)).to.be.true;

        await helpers.findAndClickElement(driver, 'button.edit-user');
        // should there be an input to change username?
        for (let input of inputs) {
          expect(await helpers.isElementVisible(driver, input)).to.be.true;
        }
        await helpers.findAndClickElement(driver, 'button.save-user');
      });
    }
    function validateNewUserPage() {
      it('should display the page title and form', async function () {
        expect(await helpers.isTextInDom(driver, 'Create New User')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'article.user')).to.be.true;
      });

      it('should show certain fields', async function () {
        expect(await helpers.isElementVisible(driver, 'input.user-username')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'input.user-password')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'input.user-name')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'input.user-email')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'input.user-location')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'select')).to.be.true;
        expect(await helpers.isElementVisible(driver, 'input.user-isAuth')).to.be.true;
      });

      it('should not let you submit form with missing fields', async function () {
        let username = `bunny`;
        await helpers.findInputAndType(driver, 'input.user-username', username);
        await helpers.selectOption(driver, 'my-select', 'T');
        await helpers.findAndClickElement(driver, 'button.user-new');
        await helpers.waitForSelector(driver, '.error-message');
        expect(await helpers.findAndGetText(driver, '.error-message')).to.contain('Missing required fields');
      });

      it('should let you create a new unauthorized teacher', async function () {
        let password = `test`;
        let name = `Bunny Doe`;
        let email = `bdoe@gmail.com`;
        let location = `Philadelphia, PA`;
        await helpers.selectOption(driver, 'my-select', 'T');
        await helpers.findInputAndType(driver, 'input.user-password', password);
        await helpers.findInputAndType(driver, 'input.user-name', name);
        await helpers.findInputAndType(driver, 'input.user-email', email);
        await helpers.findInputAndType(driver, 'input.user-location', location);
        await helpers.findAndClickElement(driver, 'button.user-new');
        await helpers.waitForSelector(driver, '#user-info');
        await driver.sleep('1000');
        expect(await helpers.findAndGetText(driver, 'ul.waiting-auth>li:first-child')).to.contain('bunny');
      });

      it('should let you create a new authorized student', async function () {
        let oldUsername = `bunny`;
        let username = `beyonce`;
        let password = `test`;
        let name = `Beyonce`;
        await helpers.findAndClickElement(driver, '#new-user-link');
        await helpers.waitForSelector(driver, 'div#user-new');
        await helpers.selectOption(driver, 'my-select', 'Student');
        await helpers.findInputAndType(driver, 'input.user-username', oldUsername);
        await helpers.findInputAndType(driver, 'input.user-password', password);
        await helpers.findInputAndType(driver, 'input.user-name', name);
        await helpers.findAndClickElement(driver, 'input.user-isAuth');
        await helpers.findAndClickElement(driver, '#new-user-btn');
        await helpers.waitForSelector(driver, '.error-message');
        expect(await helpers.findAndGetText(driver, '.error-message')).to.contain('Username already exists');
        await helpers.clearElement(driver, 'input.user-username');
        await helpers.findInputAndType(driver, 'input.user-username', username);
        await helpers.findAndClickElement(driver, '#new-user-btn');
        driver.sleep('1000');
        await helpers.waitForSelector(driver, '#user-info');
        expect(await helpers.findAndGetText(driver, 'ul.student-users>li:first-child')).to.contain('beyonce');
      });

    }

    function changeAuth() {
      it('should authorize a new user', async function () {
        await helpers.findAndClickElement(driver, 'button.edit-user');
        await helpers.findAndClickElement(driver, 'input.user-isAuth');
        await helpers.findAndClickElement(driver, 'button.save-user');
        await helpers.waitForSelector(driver, '#user-info');
        expect(await helpers.findAndGetText(driver, 'ul.teacher-users>li:first-child')).to.contain('bunny');
      });
    }

    function changeAccountType() {
      it('should change a teacher to a student', async function () {
        await helpers.findAndClickElement(driver, 'button.edit-user');
        await helpers.selectOption(driver, 'my-select', 'S');
        await helpers.findAndClickElement(driver, 'button.save-user');
        await helpers.waitForSelector(driver, '#user-info');
      });
    }

    function confirmEmail() {
      it('should manually confirm email', async function () {
        await helpers.findAndClickElement(driver, 'button.edit-user');
        await helpers.findAndClickElement(driver, 'input.user-email-auth');
        await helpers.findAndClickElement(driver, 'button.save-user');
        await helpers.waitForSelector(driver, '#user-info');
        await driver.sleep('2000');
        expect(await helpers.findAndGetText(driver, 'td.is-email-confirm')).to.contain('true');
      });
    }

    describe('Visiting the users list home page', function () {
      before(async function () {
        await helpers.navigateAndWait(driver, `${host}/#/users/home`, '#user-home');
      });

      it('should display a welcome page', async function () {
        await helpers.waitForSelector(driver, '#user-home');
      });

      it('should have a create new user link', async function () {
        await helpers.findAndClickElement(driver, `a[href="users/new"]`);
      });

      it('should display a list with your account', async function () {
        expect(await helpers.getWebElements(driver, 'ul.your-account>li')).to.have.lengthOf.at.least(1);
        expect(await helpers.findAndGetText(driver, 'ul.your-account>li:first-child')).to.contain('pdadmin');
      });

      it('should have a list of users waiting authorization', async function () {
        expect(await helpers.getWebElements(driver, 'ul.waiting-auth>li')).to.have.lengthOf.at.least(1);
        expect(await helpers.findAndGetText(driver, 'ul.waiting-auth>li:first-child')).to.contain('wes');
      });

      it('should have a list of teachers', async function () {
        expect(await helpers.getWebElements(driver, 'ul.teacher-users>li')).to.have.lengthOf.at.least(5);
        expect(await helpers.findAndGetText(driver, 'ul.teacher-users>li:first-child')).to.contain('msmith');
      });

      it('should have a list of students', async function () {
        expect(await helpers.getWebElements(driver, 'ul.student-users>li')).to.have.lengthOf.at.least(3);
        expect(await helpers.findAndGetText(driver, 'ul.student-users>li:first-child')).to.contain('newStudent');
      });

      describe('clicking on your own account', function () {
        before(async function () {
          await helpers.findAndClickElement(driver, `a[href$="#/users/${helpers.pdAdmin.username}"]`);
          await helpers.waitForSelector(driver, 'div#user-info');
        });
        validateUsersPage();
      });

      describe('clicking the Create New User link', function () {
        before(async function () {
          await helpers.findAndClickElement(driver, '#new-user-link');
          await helpers.waitForSelector(driver, 'div#user-new');
        });
        validateNewUserPage();
      });

      describe('authorizing a user', function () {
        before(async function () {
          await helpers.findAndClickElement(driver, `a[href$="#/users/bunny"]`);
        });
        changeAuth();
      });

    });
  });


});

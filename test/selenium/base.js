// REQUIRE MODULES
const { Builder, By, Key, Keys, until } = require('selenium-webdriver');
const expect = require('chai').expect;

// REQUIRE FILES
const config = require('../../server/config');
const helpers = require('./helpers');
const dbSetup = require('../data/restore');
const css = require('./selectors');

const host = helpers.host;

describe('Home Page', function () {
  this.timeout('10s');
  let driver = null;
  before(async function () {
    driver = new Builder()
      .forBrowser('chrome')
      .build();
    await dbSetup.prepTestDb();
  });
  after(() => {
    driver.quit();
  });

  it('should load without error', async function () {
    await helpers.navigateAndWait(driver, host, css.topBar.login);
  });

  it('login button should be visible', async function () {
    expect(await helpers.isElementVisible(driver, css.topBar.login)).to.be.true;
  });



  it('should display login page after clicking login', async function () {
    await helpers.findAndClickElement(driver, css.topBar.login);
    await helpers.waitForSelector(driver, css.login.username);
    let url = await helpers.getCurrentUrl(driver);

    expect(url).to.eql(helpers.loginUrl);
    expect(await helpers.isElementVisible(driver, css.login.username)).to.be.true;
    expect(await helpers.isElementVisible(driver, css.login.password)).to.be.true;
    expect(await helpers.isElementVisible(driver, css.login.submit)).to.be.true;
    expect(await helpers.isElementVisible(driver, css.login.google)).to.be.true;
    expect(await helpers.isElementVisible(driver, css.login.signup)).to.be.true;
  });

  describe('submitting login form', async function() {
    it('should display missing credentials if empty form submitted', async function() {
      await helpers.findAndClickElement(driver, css.login.submit);
      expect(await helpers.isTextInDom(driver, helpers.signinErrors.incomplete)).to.be.true;
    });

    it('should remove missing credentials error ', async function() {
      await helpers.findInputAndType(driver, css.login.username, helpers.admin.username);
      expect(await helpers.isTextInDom(driver, helpers.signinErrors.incomplete)).to.be.false;
    });

    it('should display missing credentials if password omitted', async function() {
      await helpers.findAndClickElement(driver, css.login.submit);
      expect(await helpers.isTextInDom(driver, helpers.signinErrors.incomplete)).to.be.true;
    });

    it('should remove missing credentials error', async function() {
      await helpers.findInputAndType(driver, css.login.password, 'badpassword');
      expect(await helpers.isTextInDom(driver, helpers.signinErrors.incomplete)).to.be.false;
    });

    it('should display incorrect password if wrong password submitted', async function() {
      await helpers.findAndClickElement(driver, css.login.submit);
      await driver.sleep(1000);
      expect(await helpers.isTextInDom(driver, helpers.signinErrors.password)).to.be.true;
    });

    it ('should remove incorrect password error', async function() {
      await helpers.findInputAndType(driver, css.login.username, 'q');
      expect(await helpers.isTextInDom(driver, helpers.signinErrors.password)).to.be.false;
    });

    it('should display incorrect username if wrong username submitted', async function() {
      await helpers.findAndClickElement(driver, css.login.submit);
      await driver.sleep(1000);
      expect(await helpers.isTextInDom(driver, helpers.signinErrors.username)).to.be.true;
    });

    it('should remove incorrect username error', async function() {
      //await helpers.clearElement(driver, css.login.username);
      await helpers.findInputAndType(driver, css.login.username, 's');
      //await driver.sleep(1000);
      expect(await helpers.isTextInDom(driver, helpers.signinErrors.username)).to.be.false;
    })
    it('should redirect to homepage after logging in', async function () {
      let url;
      let greeting;
      let message;

      try {
        await helpers.clearElement(driver, css.login.username);
        await helpers.clearElement(driver, css.login.password);
        await helpers.findInputAndType(driver, css.login.username, helpers.admin.username);
        await helpers.findInputAndType(driver, css.login.password, helpers.admin.password);
        await helpers.findAndClickElement(driver, css.login.submit);

        greeting = await helpers.waitForSelector(driver, '#al_welcome');
        url = await helpers.getCurrentUrl(driver);
        message = await greeting.getText();
      } catch (err) {
        console.log(err);
      }
      expect(url).to.equal(`${host}/`);
      expect(message).to.equal(`Welcome, ${helpers.admin.username}`);
    });
  });

  describe('NavBar', async function () {
    const elements = ['workspaces', 'responses', 'users', 'logout', 'problems', 'workspaces/new', 'users/new'];
    function verifyNavElement(navElement) {
      let isVisible;
      it(`${navElement} link should exist`, async function () {
        try {
          isVisible = await driver.findElement(By.css(`a[href="#/${navElement}"]`)).isDisplayed();
        } catch (err) {
          console.log(err);
        }
        expect(isVisible).to.be.true;
      });
    }
    elements.forEach((el) => {
      verifyNavElement(el);
    });
  });

  describe ('Logging Out', function() {
    it('should redirect to homepage after logging out', async function() {
      await helpers.findAndClickElement(driver, css.topBar.logout);
      await helpers.waitForSelector(driver, css.topBar.home);
      expect(await helpers.getCurrentUrl(driver)).to.eql(`${host}/`);
      expect(await helpers.isElementVisible(driver, css.topBar.login)).to.be.true;
      expect(await helpers.isElementVisible(driver, css.topBar.signup)).to.be.true;
    });
  });


});

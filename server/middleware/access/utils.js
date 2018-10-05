/* jshint ignore:start */
const models = require('../../datasource/schemas');
const _ = require('underscore');

const wsAuth =require('./workspaces');
const assignmentAuth = require('./assignments');

//Returns an array of oIds
const getModelIds = async function(model, filter={}) {
  try {
    const records = await models[model].find(filter, {_id: 1});
    return records.map(rec => rec._id);
  }catch(err) {
    return new Error(`Error retrieving modelIds: ${err}`);
  }
};

async function getOrgSections(user) {
  try {
    const org = user.organization;
    const filter = {
      organization: org
    };
    const sectionIds = await getModelIds('Section', filter);
    return sectionIds;
  } catch(err) {
    console.error(`Error getOrgSections: ${err}`);
    console.trace();
  }
}


async function getAssignmentProblems(user) {
  try {
    const criteria = await assignmentAuth.get.assignments(user);
    const assignments = await models.Assignment.find(criteria).lean();
    return assignments.map(assn => assn.problem.toString());
  } catch(err) {
    console.error(`Error getAssignmentProblems: ${err}`);
    console.trace();
  }
}

async function getTeacherAssignments(userId) {
  try {
    const ownAssignmentIds = await models.Assignment.find({createdBy: userId}, {_id: 1}).lean().exec();
    return ownAssignmentIds.map(obj => obj._id);
  } catch(err) {
    console.error(`Error getTeacherAssignments: ${err}`);
    console.trace();
  }
}

async function getTeacherSections(user) {
  try {
   ownSections = user.sections.map((section) => {
    if (section.role === 'teacher') {
      return section.sectionId;
    }
  });
  return await ownSections;
  } catch (err) {
    console.error(`Error getAssignmentProblems: ${err}`);
    console.trace();
  }
}

async function getTeacherSectionsById(userId) {
  try {
    const sectionIds = await getModelIds('Section', {teachers: userId});
    return sectionIds;
  }catch(err) {
    console.error(`Error getTeacherSectionsById: ${err}`);
    console.trace();
  }
}

const getStudentSections = function(user) {
  if (!user || !Array.isArray(user.sections)) {
    return;
  }
  return user.sections.map((section) => {
    if (section.role === 'student') {
      return section.sectionId;
    }
  });
};

const getStudentResponses = async function (user) {
  try {
    if (!user) {
      return;
    }

    let userId = user._id;

    let respones = await models.Response.find({recipient: userId}).lean().exec();

    return respones.map((response) => {
      return response.createdBy;
    });
  }catch(err) {
    console.error(`Error getStudentResponses: ${err}`);
    console.trace();
  }
};


async function getStudentUsers(user) {
  if (!user) {
    return;
  }
  try {
    const ids = [];
    ids.push(user._id);

    const sectionIds = getStudentSections(user);
    const sections = await models.Section.find({_id: {$in: sectionIds}}).lean().exec();
    const studentIds = sections.map(section => section.students);

    ids.push(studentIds);

    const teacherIds = sections.map(section => section.teachers);

    ids.push(teacherIds);

    const responseUsers = await getStudentResponses(user);

    ids.push(responseUsers);

  const flattened =  _.flatten(ids);
  return flattened.map(id => id.toString());

  }catch(err) {
    console.error(`Error getStudentUsers: ${err}`);
    console.trace();
  }
}

async function getPdAdminUsers(user) {
  try {
    if (!user) {
      return;
    }
    const ids = [];
    ids.push(user._id);
    const org = user.organization;
    const filter = {
      $or: [
        {organization: org},
        {createdBy: user._id}
      ]
    };
    const orgUserIds = await getModelIds('User', filter);

    ids.push(orgUserIds);

    const flattened = _.flatten(ids);
    return flattened.map(id => id.toString());
  }catch(err) {
    console.error(`Error getPdAdminUsers: ${err}`);
    console.trace();
  }
}
// teachers can also get all users in org, but may not be able to edit all
async function getTeacherUsers(user) {
  try {
    if (!user) {
      return;
    }
    const ids = [];
    ids.push(user._id);

    const org = user.organization;
    const filter = {
      $or: [
        {organization: org},
        {createdBy: user._id}
      ]
    };

    const orgUserIds = await getModelIds('User', filter);

    ids.push(orgUserIds);

    const flattened = _.flatten(ids);
    return flattened.map(id => id.toString());
  }catch(err) {
    console.error(`Error getTeacherUsers: ${err}`);
    console.trace();
  }
}

async function getAccessibleWorkspaceIds(user) {
  if (!user) {
    return;
  }
  try {
    const criteria = await wsAuth.get.workspaces(user, null);
    const ids = await getModelIds('Workspace', criteria);
    return ids;

  } catch(err) {
    console.error(`Error accessibleWorkspaceIds: ${err}`);
    console.trace();
  }
}

async function getUsersFromWorkspaces(workspaceIds) {
  if (!workspaceIds || !Array.isArray(workspaceIds)) {
    return [];
  }
  try {

    const workspaces = await models.Workspace.find({ _id: { $in: workspaceIds } }, { owner: 1, editors: 1 } ).lean().exec();
    const userIds =  [];
    workspaces.forEach((ws) => {
      userIds.push(ws.owner.toString());
      userIds.push(ws.editors.map(id => id.toString()));
    });

    const flattened = _.flatten(userIds);
    return flattened;

  }catch(err) {
    console.error(`Error getUsersFromWorkspaces: ${err}`);
    console.trace();
  }

}

const getCreatorIds = async function(model, crit={}) {
  try {
    if (!model) {
      return [];
    }
    let users = await models[model].find(crit, {createdBy: 1}).lean().exec();

    let withCreatedBy = users.filter(user => !!user.createdBy);
    let creators = withCreatedBy.map(user => user.createdBy.toString());

    return _.uniq(creators);
  }catch(err) {
    console.error('error getCreatorIds', err);
    console.trace();
  }
};


module.exports.getModelIds = getModelIds;
module.exports.getTeacherSections = getTeacherSections;
module.exports.getStudentSections = getStudentSections;
module.exports.getStudentUsers = getStudentUsers;
module.exports.getPdAdminUsers = getPdAdminUsers;
module.exports.getTeacherUsers = getTeacherUsers;
module.exports.getAccessibleWorkspaceIds = getAccessibleWorkspaceIds;
module.exports.getUsersFromWorkspaces = getUsersFromWorkspaces;
module.exports.getTeacherAssignments = getTeacherAssignments;
module.exports.getTeacherSectionsById = getTeacherSectionsById;
module.exports.getOrgSections = getOrgSections;
module.exports.getAssignmentProblems = getAssignmentProblems;
module.exports.getCreatorIds = getCreatorIds;
/* jshint ignore:end */
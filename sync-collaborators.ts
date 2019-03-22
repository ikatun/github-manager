import fs from 'fs';
import Octokit from '@octokit/rest';
import _ from 'lodash';

const { TOKEN } = process.env;
if (!TOKEN) {
  throw new Error('Missing token');
}

const octokit = new Octokit({
  auth: `token ${TOKEN}`,
});

function urlToRepoOwner(url: string): { repo: string, owner: string } {
  const [repo, owner] = url.split('/').filter(x => x).reverse();

  return { repo, owner };
}

async function addCollaborator(username: string, repoUrl: string) {
  console.log('adding', username, 'to', repoUrl);
  await octokit.repos.addCollaborator({ ...urlToRepoOwner(repoUrl), username, permission: 'push' });
}

async function removeCollaborator(username: string, repoUrl: string) {
  console.log('removing', username, 'from', repoUrl);
  await octokit.repos.removeCollaborator({ ...urlToRepoOwner(repoUrl), username })
}

async function getCollaborators(repoUrl: string) {
  const result = await octokit.repos.listCollaborators(urlToRepoOwner(repoUrl));

  return result.data.map(r => r.login);
}

function expandPermissionsList(permissions: any, usersAndGroups: string[]) {
  const users: Array<any> = [];

  for (const userOrGroup of usersAndGroups) {
    if (permissions[userOrGroup]) {
      users.push(...permissions[userOrGroup]);
    } else {
      users.push(userOrGroup);
    }
  }

  return users;
}

async function execute() {
  const { repositories, ...permissions } = JSON.parse(fs.readFileSync('permissions.json', 'utf8'));

  for (const repo of _.keys(repositories)) {
    const usersAndGroups = repositories[repo];
    const developers = expandPermissionsList(permissions, usersAndGroups);

    const existingCollaborators = await getCollaborators(repo);
    for (const collaboratorToRemove of _.difference(existingCollaborators, developers)) {
      await removeCollaborator(collaboratorToRemove, repo);
    }
    for (const collaboratorToAdd of _.difference(developers, existingCollaborators)) {
      await addCollaborator(collaboratorToAdd, repo);
    }
  }
}

execute().catch(console.error);

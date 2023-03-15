import { Constants } from '../config/constants/constants';
import { User } from '../models/user';

export function isBlockAdmin(currentUser: User): boolean {
  const userPhrRole = currentUser.phr_role;
  if (
    userPhrRole &&
    (userPhrRole == Constants.WEB_BLOCK_ADMIN ||
      userPhrRole == Constants.BLOCK_ADMIN)
  ) {
    return true;
  }
  return false;
}

export function isDistrictAdmin(currentUser: User): boolean {
  const userPhrRole = currentUser.phr_role;
  if (
    userPhrRole &&
    (userPhrRole == Constants.WEB_DISTRICT_ADMIN ||
      userPhrRole == Constants.DISTRICT_ADMIN)
  ) {
    return true;
  }
  return false;
}

export function isStateAdmin(currentUser: User): boolean {
  const userPhrRole = currentUser.phr_role;
  if (
    userPhrRole &&
    (userPhrRole == Constants.WEB_STATE_ADMIN ||
      userPhrRole == Constants.STATE_ADMIN)
  ) {
    return true;
  }
  return false;
}

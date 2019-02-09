import uid from 'uid2';
import { bindNodeCallback } from 'rxjs';

export const generateVerificationToken = bindNodeCallback(uid.bind(null, 64));

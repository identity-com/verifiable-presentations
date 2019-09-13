import _ from 'lodash';
import { VC } from '@identity.com/credential-commons/src';
import { Credential } from './Credential';

export type VerifyFunction = (credential : Credential) => boolean;

export class PresentationVerifier {
    verifyAnchor : VerifyFunction;

    constructor(verifyAnchor? : VerifyFunction) {
        this.verifyAnchor = verifyAnchor;
    }

    nonCryptographicallySecureVerify(credential : Credential) {
        return VC.nonCryptographicallySecureVerify(credential);
    }
}

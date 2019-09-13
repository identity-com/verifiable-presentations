import _ from 'lodash';
import { VC } from '@identity.com/credential-commons/src';
import { Credential, CredentialProof } from './Credential';

export type VerifyFunction = (credentialProof : CredentialProof) => boolean;

/**
 * Provide utility methods to verify a presentation/credential
 */
export class PresentationVerifier {
    verifyAnchor : VerifyFunction;
    verifySignature : VerifyFunction;

    constructor(verifyAnchor? : VerifyFunction, verifySignature? : VerifyFunction) {
        this.verifyAnchor = verifyAnchor;
        this.verifySignature = verifySignature;
    }

    /**
     * Non cryptographically secure verify the Credential
     * Performs a synchronous proof verification only.
     * @param credential - A credential object with expirationDate, claim and proof
     * @return true if verified, false otherwise.
     */
    nonCryptographicallySecureVerify(credential : Credential) {
        return VC.nonCryptographicallySecureVerify(credential);
    }
}

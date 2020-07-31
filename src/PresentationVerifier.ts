import { VC } from '@identity.com/credential-commons';
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

    /**
     * Cryptographically secure verify the Credential.
     * Performs a non cryptographically secure verification, attestation check and signature validation.
     * @param credential - A credential object with expirationDate, claim and proof
     * @param verifyAttestationFunc - Async method to verify a credential attestation
     * @param verifySignatureFunc - Async method to verify a credential signature
     * @return true if verified, false otherwise.
     */
    async cryptographicallySecureVerify(credential : Credential) {
        return VC.cryptographicallySecureVerify(credential, this.verifyAnchor, this.verifySignature);
    }

    /**
     * Verify if a credential was granted for a specific requesterId and requestId.
     *
     * @param credential - A credential object
     * @param requesterId - A requester Id used to calculate the granted signature
     * @param requesterId - A request Id used to calculate the granted signature
     * @return true if verified, false otherwise.
     */
    verifyGrant(credential : Credential, requesterId : string, requestId : string) {
        return VC.requesterGrantVerify(credential, requesterId, requestId);
    }
}

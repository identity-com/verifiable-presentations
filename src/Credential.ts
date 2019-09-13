/**
 * A Verifiable Claim Identifier
 */
// TODO complete the list
export type ClaimIdentifier = 'credential-cvc:Email-v1'
    | 'claim-cvc:Contact.phoneNumber-v1';

/**
 * A VerifiableCredential Identifier
 * This define the type of the verifiable credential or verifiable presentation
 */
// TODO complete the list
export type CredentialIdentifier = 'credential-cvc:Email-v1'
    | 'credential-cvc:PhoneNumber-v1'
    | 'credential-cvc:GenericDocumentId-v1';

/**
 * Credential Proof Leave Representation
 */
export interface CredentialProofLeave {
    /**
     * see [[ClaimIdentifier]]
     */
    identifier: ClaimIdentifier;
    /**
     * The leave value
     */
    value: string;
    /**
     * The claim path
     */
    claimPath: string;
}

/**
 * Credential Proof Representation
 */
export interface CredentialProof {
    /**
     * A list of [[CredentialProofLeave]]
     */
    leaves: CredentialProofLeave[];
}

/**
 * Credential representation
 */
export interface Credential {
    /**
     * Unique identifier
     */
    id: string;
    /**
     * see [[CredentialIdentifier]]
     */
    identifier: CredentialIdentifier;
    /**
     * The expiration credential date
     */
    expirationDate: string;
    /**
     * see [[CredentialProof]]
     */
    proof: CredentialProof;
    /**
     * Claim values (dynamic object)
     */
    claim: any;
}

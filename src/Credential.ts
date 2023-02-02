/**
 * A Verifiable Claim Identifier
 */
export type ClaimIdentifier = string;

/**
 * A VerifiableCredential Identifier
 * This define the type of the verifiable credential or verifiable presentation
 */
export type CredentialIdentifier = string;

/**
 * Credential Proof Leave Node Representation
 */
export interface CredentialProofLeaveNode {
    right? : string;
    left? : string;
}

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
    /**
     * The target hash
     */
    targetHash: string;
    /**
     * node
     */
    node: CredentialProofLeaveNode[];
}

/**
 * Credential Proof Representation
 */
export interface CredentialProof {
    /**
     * A list of [[CredentialProofLeave]]
     */
    leaves: CredentialProofLeave[];
    /**
     * The proof anchor information
     */
    anchor : any;
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
    expirationDate?: string;
    /**
     * see [[CredentialProof]]
     */
    proof: CredentialProof;
    /**
     * Claim values (dynamic object)
     */
    claim: any;
}

import * as _ from 'lodash';
import {
    ClaimIdentifier,
    CredentialIdentifier,
    CredentialProofLeave,
    Credential
} from './Credential';
import { VerifyAnchorFunction } from './PresentationVerifier';

/**
 * Used to setup VerifiablePresentationManager global behavior
 */
export interface VPMOptions {
    /**
     * disable the verification when adding new items to manager control
     */
    skipAddVerify?: boolean;
    /**
     * disable the verification when getting managed values. default, false.
     */
    skipGetVerify?: boolean;
    /**
     * Allow to get values if both verifications are disabled. default, false.
     */
    allowGetUnverified?: boolean;
    /**
     * Allow to list managed content if both verifications are disabled. default, false.
     */
    allowListUnverified?: boolean;
    /**
     * Allow usage os the mock API and to return mocked unverified values. default, false.
     */
    allowMocks?: boolean
    /**
     *  Avoid to throw exceptions. Useful for batch operation but is not a good practice. default, false.
     */
    notThrow?: boolean
}

/**
 * An unique reference to a managed presentation
 */
export interface PresentationReference {
    /**
     * see [[CredentialIdentifier]]
     */
    identifier: CredentialIdentifier;
    /**
     * an unique key
     */
    uid: string;
}
/**
 * An unique reference to a managed claim
 */
export interface AvailableClaim {
    /**
     * see [[ClaimIdentifier]]
     */
    identifier: ClaimIdentifier;
    /**
     * see [[PresentationReference]]
     */
    credentialRef: PresentationReference;
    /**
     * the structure path here to find the claim values
     */
    claimPath: string;
}

/**
 * A search criteria to find managed claim
 */
export interface SearchClaimCriteria {
    identifier?: ClaimIdentifier;
    credentialRef?: PresentationReference;
    claimPath?: string;
}

/**
 * An Manager to secure handle Verifiable Presentations and Evidences.
 *
 * A Verifiable Presentation is a filtered credential that doesn't have all the expected claims for
 * an Verifiable Credential of the type but still holds all verification properties for the claims
 * presented in the shared JSON structure.
 *
 * An Evidence is data collect during the validation process that is present as a Verifiable Claim
 * but can be linked to a claim. Making it possible to verify if that data was the same used to issue
 * the credential. This is useful for document images, selfies, etc...
 */

/**
 * Evidence representation
 */
export interface Evidence {
    /**
     * The Evidence content ("selfie", "idDocumentBack", "idDocumentFront")
     */
    content: string;
    /**
     * The Evidence content-type
     */
    contentType: string;
    /**
     * The Evidence sha256
     */
    sha256: string;
    /**
     * The base 64 encoded representation of the evidence
     */
    base64Encoded: string;
}

/**
 * Optional sets of Verifiable Presentations and/or Evidences in a JSONformat
 */
export interface CredentialArtifacts {
    /**
     * an array of JSONs with Verifiable (Credentials or Presentation)
     */
    presentations?: Credential[];

    /**
     * an array of JSONs with Evidences (Credentials or Presentation)
     */
    evidences?: Evidence[];
}


/**
 * Summary of the VerifiablePresentationManager status exposing the current configuration
 * and an aggregation of it managed state
 */
export interface VerifiablePresentationManagerStatus {
    config: VPMOptions;
    verifiedPresentations: number;
    totalPresentations: number;
    verifiedEvidences: number;
    totalEvidences: number;
}

/**
 * JSON contain a DSR
 */
export type DSRJSON = string;



/**
 * Abstract all complexity about the Verifiable Credentials handling by providing utility methods
 * to access user verified data in a secure way unless the security behavior is explicit flexed.
 *
 * By Default the only check not performed is the blockchain anchor check that must be explicit enable
 * by providing a verification plugin that can handle the verification in a async way.
 */
export class VerifiablePresentationManager {
    options: VPMOptions;
    artifacts: CredentialArtifacts;
    presentations: PresentationReference[];
    claims: AvailableClaim[];
    status: VerifiablePresentationManagerStatus;
    verifyAnchor : VerifyAnchorFunction;

    /**
     * @param options - Defines the global behavior and security of VerifiablePresentationManager
     * @param verifyAnchor - An async function that is able to verify the presentation anchor in a public Blockchain
     */
    constructor(options: VPMOptions, verifyAnchor? : VerifyAnchorFunction) {
        this.options = options;
        this.presentations = [];
        this.claims = [];
        this.artifacts = {
            presentations: [],
            evidences: []
        }
        this.status = {
            config: options,
            verifiedPresentations: 0,
            totalPresentations: 0,
            verifiedEvidences: 0,
            totalEvidences: 0
        }
        this.verifyAnchor = verifyAnchor;
    }

    /**
     * Adds a set Verifiable Presentations and Evidences to the manager control
     *
     * if neither `skipAddVerify` or `notThrow` are true, it throws an acception
     * once it process one invalid artifact.
     *
     * @param artifacts
     *
     */
    // @ts-ignore
    async addCredentialArtifacts(artifacts: CredentialArtifacts): Promise<VerifiablePresentationManagerStatus> {
        this.aggregateCredentialArtifacts(artifacts);

        if (artifacts.presentations) {
            artifacts.presentations.forEach(presentation => {
                const presentationReference = this.getPresentationReference(presentation);
                this.presentations.push(presentationReference);

                const availableClaims = this.getAvailableClaims(presentation.proof.leaves, presentationReference);
                this.claims = this.claims.concat(availableClaims);
            });
        }

        this.status.totalPresentations = this.presentations.length;
        this.status.totalEvidences = this.artifacts.evidences.length;
        return this.status;
    }

    /**
     * List managed presentations returning in accordance with the config
     *
     * if `allowListUnverified` is true, presentations that were not verified yet will be returned.
     * but known invalid presentations are never returned
     *
     */
    async listPresentations(): Promise<PresentationReference[]>{
        return this.presentations;
    };

    /**
     * List managed claim returning in accordance with the config
     *
     * if `allowListUnverified` is true, claim that were not verified yet will be returned.
     * but known invalid presentations are never returned
     *
     */
    async listClaims(): Promise<AvailableClaim[]> {
        return this.claims;
    };

    /**
     * List managed claim of a given Credential type returning in accordance with the config
     *
     * if `allowListUnverified` is true, claim that were not verified yet will be returned.
     * but known invalid presentations are never returned
     *
     */
    async listPresentationClaims(presentationRef: PresentationReference): Promise<AvailableClaim[]>{
        return _.filter(this.claims, { credentialRef: presentationRef });
    };

    /**
     * search for a valid claim tha matches the criterias.
     * if `allowGetUnverified` is true the search also include claim not verified yet.
     * the search never includes known invalid claims
     */
    async findClaims(criteria: SearchClaimCriteria): Promise<AvailableClaim[] | null> {
        return _.filter(this.claims, criteria);
    }

    /**
     * return the STRING value of a valid avaliable claim.
     * if `allowGetUnverified` is true it return unverified values.
     * if `notThrow` is true return null for known invalid claims
     */
    async getClaimValue(availableClaim: AvailableClaim): Promise<any | null> {
        const presentation = this.getPresentation(availableClaim);
        if (presentation && presentation.claim) {
            return _.get(presentation.claim, availableClaim.claimPath);
        }
        return null;
    }

    /**
     * List managed evidences
     */
    async listEvidences() : Promise<Evidence[]> {
        return this.artifacts.evidences;
    }

    // TODO complete documentation
    async getEvidenceValue() {
        // @ts-ignore
    }

    // @ts-ignore
    async verifyAllArtifacts(): Promise<VerifiablePresentationManagerStatus> {
        // @ts-ignore
    }

    /**
     * Verify if an presentation was GRANTED for a specif DSR
     *
     * This will first verify that the DSR is valid and not tampered,
     * them will verify if the presentation was shared with user consent and signatures
     *
     * @param presentationRef the managed presentation to verify
     * @param originalRequestDSR the original Dynamic Scope Request that receive the presentation as result
     */
    // @ts-ignore
    async wasGrantedForDSR(presentationRef: PresentationReference, originalRequestDSR: DSRJSON) {
        // @ts-ignore
    }

    isAllArtifactsVerified() {
        // @ts-ignore
    }

    purgeInvalidArtifacts() {
        // @ts-ignore
    }

    /*
     * Private methods
     */

    private getPresentation(availableClaim : AvailableClaim) : Credential | undefined {
        return _.find(this.artifacts.presentations, (presentation : Credential) => (
            presentation.id === availableClaim.credentialRef.uid
        ));
    }

    private aggregateCredentialArtifacts(artifacts : CredentialArtifacts) {
        if (this.artifacts.presentations && artifacts.presentations) {
            this.artifacts.presentations = this.artifacts.presentations.concat(artifacts.presentations);
        }
        if (this.artifacts.evidences && artifacts.evidences) {
            this.artifacts.evidences = this.artifacts.evidences.concat(artifacts.evidences);
        }
    }

    private getPresentationReference(credential: Credential) : PresentationReference {
        return {
            identifier: credential.identifier,
            uid: credential.id
        };
    }

    private getAvailableClaims(claims: CredentialProofLeave[], presentation: PresentationReference) {
        return claims.map((claim: CredentialProofLeave) => ({
            identifier: claim.identifier,
            credentialRef: presentation,
            claimPath: claim.claimPath
        }));
    }
}

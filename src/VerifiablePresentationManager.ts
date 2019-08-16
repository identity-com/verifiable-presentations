/**
 * Used to setup VerifiablePresentationManager global behavior
 */
export interface VPMOptions {
    /**
     * disable the verification when adding new items to manager control
     */
    skipAddVerify: boolean;
    /**
     * disable the verification when getting managed values. default, false.
     */
    skipGetVerify: boolean;
    /**
     * Allow to get values if both verifications are disabled. default, false.
     */
    allowGetUnverified: boolean;
    /**
     * Allow to list managed content if both verifications are disabled. default, false.
     */
    allowListUnverified: boolean;
    /**
     * Allow usage os the mock API and to return mocked unverified values. default, false.
     */
    allowMocks: boolean
    /**
     *  Avoid to throw exceptions. Useful for batch operation but is not a good practice. default, false.
     */
    notThrow: boolean
}

/**
 * A VerifiableCredential Identifier
 * This define the type of the verifiable credential or verifiable presentation
 */
// TODO complete the list
export type CredentialIdentifier = 'credential-cvc:Email-v1' | 'credential-cvc:PhoneNumber-v1'
    | 'credential-cvc:GenericDocumentId-v1';

/**
 * An unique reference to a managed presentation
 */
export interface PresentationReference {
    /**
     * see [[CredentialIdentifier]]
     */
    identifier: ClaimIdentifier;
    /**
     * an unverified human readable value
     */
    title: string;
    /**
     * an unique key
     */
    uid: string;
}

/**
 * A Verifiable Claim Identifier
 */
// TODO complete the list
export type ClaimIdentifier = 'credential-cvc:Email-v1' | 'credential-cvc:PhoneNumber-v1';

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
 * A Verifiable Presentation is a filtered credential that don't have all the expected claims for
 * an Verifiable Credential of the type but still holds all verification properties for the claims
 * presented in the shared JSON structure.
 *
 * An Evidence as data collect during the validations process the is present as a Verifiable Claim
 * but can be linked to a claim. Making ppossible to verify if that data was the same used to issue
 * the credential. This is useful for document images, selfies, etc...
 */


/**
 * Optional sets of Verifiable Presentations and/or Evidences in a JSONformat
 */
export interface CredentialArtifacts {
    /**
     * an array of JSONs with Verifiable (Credentials or Presentation)
     */
    presentations?: Array<string>;
    /**
     * an array of JSONs with Evidences (Credentials or Presentation)
     */
    evidences?: Array<string>;
}


/**
 * Summary the VerifiablePresentationManager status exposing the current configuration
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

    /**
     * @param options - Defines the global behavior and security of VerifiablePresentationManager
     * @param verifyAnchor - An async function that is able to verify the presentation anchor in a public Blockchain
     */
    constructor(options: VPMOptions, verifyAnchor=null) {

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

    }

    /**
     * List managed presentations returning in accordance with the config
     *
     * if `allowListUnverified` is true, presentations that were not verified yet will be returned.
     * but known invalid presentations are never returned
     *
     */
    // @ts-ignore
    async listPresentations(): Promise<Array<PresentationReference>>{

    };

    /**
     * List managed claim returning in accordance with the config
     *
     * if `allowListUnverified` is true, claim that were not verified yet will be returned.
     * but known invalid presentations are never returned
     *
     */
    // @ts-ignore
    async listClaims(): Promise<Array<AvailableClaim>> {

    };

    /**
     * List managed claim of a given Credential type returning in accordance with the config
     *
     * if `allowListUnverified` is true, claim that were not verified yet will be returned.
     * but known invalid presentations are never returned
     *
     */
    // @ts-ignore
    async listPresentationClaims(presentationRef: PresentationReference): Promise<Array<AvailableClaim>>{

    };

    /**
     * search for a valid claim tha matches the criterias.
     * if `allowGetUnverified` is true the search also include claim not verified yet.
     * the search never includes known invalid claims
     */
    // @ts-ignore
    findClaim(criteria: SearchClaimCriteria): AvailableClaim | null {

    }

    /**
     * return the STRING value of a valid avaliable claim.
     * if `allowGetUnverified` is true it return unverified values.
     * if `notThrow` is true return null for known invalid claims
     */
    // @ts-ignore
    async getClaimValue(availableClaim: AvailableClaim): Promise<string | null> {

    }

    //TODO complete documentation
    async listEvidences() {

    }

    //TODO complete documentation
    async getEvidenceValue() {

    }

    // @ts-ignore
    async verifyAllArtifacts(): Promise<VerifiablePresentationManagerStatus> {

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
    async wasGrantedForDSR(presentationRef: PresentationReference, originalRequestDSR: DSRJSON) {

    }

    isAllArtifactsVerified() {

    }

    purgeInvalidArtifacts() {

    }

}

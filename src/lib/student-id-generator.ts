import { doc, runTransaction, Firestore } from 'firebase/firestore';

/**
 * Generates a unique student ID in the format: [UniCode][DeptCode][Year][Sequence]
 * Example: CUEAR23001
 * 
 * @param firestore The Firestore instance
 * @param universityCode The code of the university (e.g., "CUE")
 * @param departmentCode The code of the department (e.g., "AR")
 * @returns The generated student ID
 */
export async function generateStudentId(firestore: Firestore, universityCode: string, departmentCode: string): Promise<string> {
    const db = firestore;
    const year = new Date().getFullYear().toString().slice(-2); // Last 2 digits of year (e.g., "23")
    const prefix = `${universityCode}${departmentCode}${year}`;

    const counterRef = doc(db, 'counters', 'student_ids');

    try {
        const newId = await runTransaction(db, async (transaction) => {
            const docSnapshot = await transaction.get(counterRef);

            let currentSequence = 0;

            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                if (data && data[prefix] !== undefined) {
                    currentSequence = data[prefix];
                }
            }

            const nextSequence = currentSequence + 1;

            // Update the counter
            transaction.set(counterRef, { [prefix]: nextSequence }, { merge: true });

            // Format sequence to 3 digits (e.g., 001, 010, 100)
            const sequenceStr = nextSequence.toString().padStart(3, '0');

            return `${prefix}${sequenceStr}`;
        });

        return newId;
    } catch (error: any) {
        console.error('Error generating student ID:', error);
        throw new Error(`Failed to generate student ID: ${error.message || error}`);
    }
}

// Получить элемент
export const getElm = (testId: string) => !!testId ? cy.get("[test-id='" + testId + "']") : null;

// Проверить наличие элемента
export const elmExists = (testId: string) => getElm(testId)?.should('exist');

// Проверить отсутствие элемента элемента
export const elmNotExists = (testId: string) => getElm(testId)?.should('not.exist');

declare module "noisejs" {
  export class Noise {
    /**
    * Передача начального значения засеет этот экземпляр Noise
    * @param {number} seed
    * @return {Noise} Экземпляр шума
    */
    constructor(seed?: number);

    /**
     * 2D симплексный шум
     * @param  {number} x
     * @param  {number} y
     * @return {number} Значение шума
     */
    simplex2(x: number, y: number): number;

    /**
     * 3D симплексный шум
     * @param  {number} x
     * @param  {number} y
     * @param  {number} z
     * @return {number} Значение шума
     */
    simplex3(x: number, y: number, z: number): number;

    /**
     * 2D-шум Перлина
     * @param  {number} x
     * @param  {number} y
     * @return {number} Значение шума
     */
    perlin2(x: number, y: number): number;

    /**
     * 3D-шум Перлина
     * @param  {number} x
     * @param  {number} y
     * @param  {number} z
     * @return {number} Значение шума
     */
    perlin3(x: number, y: number, z: number): number;

    /**
     * Это не очень хорошая функция раздачи, но она работает нормально. Он поддерживает
     * 2^16 различных начальных значений. Напишите что-нибудь получше, если вам нужно больше сидов.
     * @param {number} seed [description]
     */
    seed(seed: number): void;
  }
}

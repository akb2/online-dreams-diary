/**
 * Вершинный шейдер
 */
export const VertexShader = `
  in vec3 position;

  uniform mat4 modelMatrix;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform vec3 cameraPosition;

  out vec3 vOrigin;
  out vec3 vDirection;
  out vec3 vPosition;
  out float vFogDepth;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

    vOrigin = vec3(inverse(modelMatrix) * vec4( cameraPosition, 1.0 ) ).xyz;
    vDirection = position - vOrigin;
    vPosition = position;
    vFogDepth = - mvPosition.z;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

/**
 * Фрагментный шейдер
 */
export const FragmentShader = `
  #define saturate( a ) clamp( a, 0.0, 1.0 )

  precision highp float;
  precision highp sampler3D;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  in vec3 vOrigin;
  in vec3 vDirection;
  in vec3 vPosition;
  in float vFogDepth;

  out vec4 color;

  uniform vec3 base;
  uniform sampler3D map;

  uniform float threshold;
  uniform float range;
  uniform float opacity;
  uniform float steps;
  uniform float frame;
  uniform vec3 boxSize;
  uniform float fogNear;
  uniform float fogFar;
  uniform float discardOpacity;

  uint wang_hash(uint seed)
  {
      seed = (seed ^ 61u) ^ (seed >> 16u);
      seed *= 9u;
      seed = seed ^ (seed >> 4u);
      seed *= 0x27d4eb2du;
      seed = seed ^ (seed >> 15u);
      return seed;
  }

  float randomFloat(inout uint seed)
  {
      return float(wang_hash(seed)) / 4294967296.;
  }

  vec2 hitBox( vec3 orig, vec3 dir ) {
    vec3 halfBoxSize = boxSize / vec3(2.);
    vec3 box_min = halfBoxSize * vec3(-1.);
    vec3 box_max = halfBoxSize;
    vec3 inv_dir = 1.0 / dir;
    vec3 tmin_tmp = ( box_min - orig ) * inv_dir;
    vec3 tmax_tmp = ( box_max - orig ) * inv_dir;
    vec3 tmin = min( tmin_tmp, tmax_tmp );
    vec3 tmax = max( tmin_tmp, tmax_tmp );
    float t0 = max( tmin.x, max( tmin.y, tmin.z ) );
    float t1 = min( tmax.x, min( tmax.y, tmax.z ) );
    return vec2( t0, t1 );
  }

  float sample1( vec3 p ) {
    return texture( map, p ).r;
  }

  float shading( vec3 coord ) {
    float step = 0.01;
    return sample1( coord + vec3( - step ) ) - sample1( coord + vec3( step ) );
  }

  vec4 linearToSRGB( in vec4 value ) {
    return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
  }

  void main(){
    vec3 rayDir = normalize( vDirection );
    vec2 bounds = hitBox( vOrigin, rayDir );
    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );

    if ( bounds.x > bounds.y ) {
      discard;
    }

    bounds.x = max( bounds.x, 0.0 );

    vec3 p = vOrigin + (bounds.x * rayDir);
    vec3 inc = 1.0 / abs( rayDir );
    float delta = min( inc.x, min( inc.y, inc.z ) );
    delta /= steps;

    uint seed = uint( gl_FragCoord.x ) * uint( 1973 ) + uint( gl_FragCoord.y ) * uint( 9277 ) + uint( frame ) * uint( 26699 );
    vec3 size = vec3( textureSize( map, 0 ) );
    float randNum = randomFloat( seed ) * 2.0 - 1.0;
    p += rayDir * randNum * ( 1.0 / size );

    vec4 ac = vec4( base, 0.0 );

    for ( float t = bounds.x; t < bounds.y; t += delta ) {
      vec3 realP = p / boxSize;
      float d = sample1(realP + 0.5);
      d = smoothstep( threshold - range, threshold + range, d ) * opacity;
      float col = shading(realP + 0.5) * 3.0 + ((realP.x + realP.y) * 0.25) + 0.2;
      ac.rgb += ( 1.0 - ac.a ) * d * col;
      ac.a += ( 1.0 - ac.a ) * d;

      if ( ac.a >= 0.95 ) {
        break;
      }

      p += rayDir * delta;
    }

    color = linearToSRGB(ac);
    color.a = max(0., saturate(color.a - fogFactor));

    if ( color.a <= discardOpacity ) {
      discard;
    }
  }
`;

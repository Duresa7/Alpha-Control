import { LegalShell } from '@/components/legal/LegalShell';

export function CreditsPage() {
  return (
    <LegalShell>
      <h1 className="legal-page__title">3D Model Credits</h1>
      <p className="legal-page__updated">
        The following third-party 3D models are used in this application under Creative Commons
        licenses. We gratefully credit their creators below. Click any entry to expand it.
      </p>

      <section className="legal-page__section">
        <h2>Ships</h2>
        <div className="legal-accordion">
          <details className="legal-accordion__item">
            <summary className="legal-accordion__summary">
              Star Wars Republic Frigate
              <span className="legal-accordion__tag">CC BY 4.0</span>
            </summary>
            <div className="legal-accordion__body">
              <ul>
                <li>
                  <strong>Author:</strong> iedalton
                </li>
                <li>
                  <strong>Source:</strong>{' '}
                  <a href="https://skfb.ly/6RNL6" target="_blank" rel="noopener noreferrer">
                    https://skfb.ly/6RNL6
                  </a>
                </li>
                <li>
                  <strong>License:</strong>{' '}
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Creative Commons Attribution 4.0 (CC BY 4.0)
                  </a>
                </li>
                <li>
                  <strong>Changes:</strong> None
                </li>
              </ul>
            </div>
          </details>

          <details className="legal-accordion__item">
            <summary className="legal-accordion__summary">
              Harrower Class Dreadnought
              <span className="legal-accordion__tag">CC BY 4.0</span>
            </summary>
            <div className="legal-accordion__body">
              <ul>
                <li>
                  <strong>Author:</strong> Kuat-Entralla 3D Engineering
                </li>
                <li>
                  <strong>Source:</strong>{' '}
                  <a href="https://skfb.ly/6YW6I" target="_blank" rel="noopener noreferrer">
                    https://skfb.ly/6YW6I
                  </a>
                </li>
                <li>
                  <strong>License:</strong>{' '}
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Creative Commons Attribution 4.0 (CC BY 4.0)
                  </a>
                </li>
                <li>
                  <strong>Changes:</strong> None
                </li>
              </ul>
            </div>
          </details>

          <details className="legal-accordion__item">
            <summary className="legal-accordion__summary">
              Valor-class Cruiser
              <span className="legal-accordion__tag legal-accordion__tag--modified">
                CC BY / Modified
              </span>
            </summary>
            <div className="legal-accordion__body">
              <ul>
                <li>
                  <strong>Author:</strong> Gargi (Thingiverse)
                </li>
                <li>
                  <strong>Source:</strong>{' '}
                  <a
                    href="https://cults3d.com/en/3d-model/game/star-wars-the-old-republic-valor-class"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    cults3d.com
                  </a>
                </li>
                <li>
                  <strong>License:</strong>{' '}
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Creative Commons Attribution (CC BY)
                  </a>
                </li>
                <li>
                  <strong>Changes:</strong> Modified for use in this application
                </li>
              </ul>
            </div>
          </details>

          <details className="legal-accordion__item">
            <summary className="legal-accordion__summary">
              Terminus-class Destroyer
              <span className="legal-accordion__tag legal-accordion__tag--modified">
                CC BY / Modified
              </span>
            </summary>
            <div className="legal-accordion__body">
              <ul>
                <li>
                  <strong>Author:</strong> OmegaNova (Thingiverse)
                </li>
                <li>
                  <strong>Source:</strong>{' '}
                  <a
                    href="https://www.thingiverse.com/thing:1949904"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    thingiverse.com
                  </a>
                </li>
                <li>
                  <strong>License:</strong>{' '}
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Creative Commons Attribution (CC BY)
                  </a>
                </li>
                <li>
                  <strong>Changes:</strong> Modified for use in this application
                </li>
              </ul>
            </div>
          </details>
        </div>
      </section>

      <section className="legal-page__section">
        <h2>Planets</h2>
        <div className="legal-accordion">
          <details className="legal-accordion__item">
            <summary className="legal-accordion__summary">
              Alderaan
              <span className="legal-accordion__tag legal-accordion__tag--modified">
                CC BY 4.0 / Modified
              </span>
            </summary>
            <div className="legal-accordion__body">
              <ul>
                <li>
                  <strong>Author:</strong> uperesito
                </li>
                <li>
                  <strong>Original title:</strong> Io Terraformed
                </li>
                <li>
                  <strong>Source:</strong>{' '}
                  <a href="https://skfb.ly/6oYuZ" target="_blank" rel="noopener noreferrer">
                    https://skfb.ly/6oYuZ
                  </a>
                </li>
                <li>
                  <strong>License:</strong>{' '}
                  <a
                    href="http://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Creative Commons Attribution 4.0 (CC BY 4.0)
                  </a>
                </li>
                <li>
                  <strong>Changes:</strong> Modified and adapted for use as Alderaan in this
                  application
                </li>
              </ul>
            </div>
          </details>

          <details className="legal-accordion__item">
            <summary className="legal-accordion__summary">
              Tatooine
              <span className="legal-accordion__tag legal-accordion__tag--modified">
                CC BY 4.0 / Modified
              </span>
            </summary>
            <div className="legal-accordion__body">
              <ul>
                <li>
                  <strong>Author:</strong> JanesBT
                </li>
                <li>
                  <strong>Original title:</strong> Mars
                </li>
                <li>
                  <strong>Source:</strong>{' '}
                  <a href="https://skfb.ly/oyCyK" target="_blank" rel="noopener noreferrer">
                    https://skfb.ly/oyCyK
                  </a>
                </li>
                <li>
                  <strong>License:</strong>{' '}
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Creative Commons Attribution 4.0 (CC BY 4.0)
                  </a>
                </li>
                <li>
                  <strong>Changes:</strong> Modified and adapted for use as Tatooine in this
                  application
                </li>
              </ul>
            </div>
          </details>

          <details className="legal-accordion__item">
            <summary className="legal-accordion__summary">
              Korriban
              <span className="legal-accordion__tag legal-accordion__tag--modified">
                CC BY 4.0 / Modified
              </span>
            </summary>
            <div className="legal-accordion__body">
              <ul>
                <li>
                  <strong>Author:</strong> JanesBT
                </li>
                <li>
                  <strong>Original title:</strong> Mars
                </li>
                <li>
                  <strong>Source:</strong>{' '}
                  <a href="https://skfb.ly/oyCyK" target="_blank" rel="noopener noreferrer">
                    https://skfb.ly/oyCyK
                  </a>
                </li>
                <li>
                  <strong>License:</strong>{' '}
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Creative Commons Attribution 4.0 (CC BY 4.0)
                  </a>
                </li>
                <li>
                  <strong>Changes:</strong> Modified and adapted for use as Korriban in this
                  application
                </li>
              </ul>
            </div>
          </details>

          <details className="legal-accordion__item">
            <summary className="legal-accordion__summary">
              Coruscant
              <span className="legal-accordion__tag legal-accordion__tag--nc">CC BY-NC 4.0</span>
            </summary>
            <div className="legal-accordion__body">
              <ul>
                <li>
                  <strong>Author:</strong> SpatialNeglect
                </li>
                <li>
                  <strong>Source:</strong>{' '}
                  <a href="https://skfb.ly/6YYz7" target="_blank" rel="noopener noreferrer">
                    https://skfb.ly/6YYz7
                  </a>
                </li>
                <li>
                  <strong>License:</strong>{' '}
                  <a
                    href="https://creativecommons.org/licenses/by-nc/4.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Creative Commons Attribution-NonCommercial 4.0 (CC BY-NC 4.0)
                  </a>
                </li>
                <li>
                  <strong>Changes:</strong> None
                </li>
              </ul>
            </div>
          </details>

          <details className="legal-accordion__item">
            <summary className="legal-accordion__summary">
              Hoth
              <span className="legal-accordion__tag legal-accordion__tag--modified">
                CC BY 4.0 / Modified
              </span>
            </summary>
            <div className="legal-accordion__body">
              <ul>
                <li>
                  <strong>Author:</strong> LazarCraze
                </li>
                <li>
                  <strong>Original title:</strong> Cryonox
                </li>
                <li>
                  <strong>Source:</strong>{' '}
                  <a href="https://skfb.ly/pvZSG" target="_blank" rel="noopener noreferrer">
                    https://skfb.ly/pvZSG
                  </a>
                </li>
                <li>
                  <strong>Alternate listing:</strong>{' '}
                  <a
                    href="https://open3dmodel.com/3d-models/sci-fi-planet-hoth_485302.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    open3dmodel.com
                  </a>
                </li>
                <li>
                  <strong>License:</strong>{' '}
                  <a
                    href="http://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Creative Commons Attribution 4.0 (CC BY 4.0)
                  </a>
                </li>
                <li>
                  <strong>Changes:</strong> Modified and adapted for use as Hoth in this application
                </li>
              </ul>
            </div>
          </details>
        </div>
      </section>
    </LegalShell>
  );
}

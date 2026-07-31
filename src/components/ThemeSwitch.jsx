import React from 'react';

const ThemeSwitch = ({ checked, onChange }) => {
  return (
    <>
      <style>{`
        .toggle-switch-wrapper {
          transform: scale(0.55);
          transform-origin: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .toggle-switch {
          position: relative;
          width: 100px;
          height: 50px;
          --light: #d8dbe0;
          --dark: #28292c;
        }
      
        .switch-label {
          position: absolute;
          width: 100%;
          height: 50px;
          background-color: var(--dark);
          border-radius: 25px;
          cursor: pointer;
          border: 3px solid var(--dark);
          margin: 0;
        }
      
        .switch-checkbox {
          position: absolute;
          display: none;
        }
      
        .switch-slider {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 25px;
          transition: 0.3s;
          left: 0;
          top: 0;
        }
      
        .switch-checkbox:checked ~ .switch-slider {
          background-color: var(--light);
        }
      
        .switch-slider::before {
          content: "";
          position: absolute;
          top: 10px;
          left: 10px;
          width: 25px;
          height: 25px;
          border-radius: 50%;
          box-shadow: inset 12px -4px 0 0 var(--light);
          background-color: var(--dark);
          transition: 0.3s;
        }
      
        .switch-checkbox:checked ~ .switch-slider::before {
          transform: translateX(50px);
          background-color: var(--dark);
          box-shadow: none;
        }
      `}</style>
      <div className="toggle-switch-wrapper">
        <div className="toggle-switch">
          <label className="switch-label">
            <input
              type="checkbox"
              className="switch-checkbox"
              checked={checked}
              onChange={onChange}
            />
            <span className="switch-slider" />
          </label>
        </div>
      </div>
    </>
  );
};

export default ThemeSwitch;

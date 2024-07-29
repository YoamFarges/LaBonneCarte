import "./shared/styles/lbca.less"

const LBCAPopup = () => {
    return (
        <div className="plasmo_popup">
            <div className="flex">
                <img src={chrome.runtime.getURL(`assets/icon_small.png`)} width={44} height={44} />
                <h1>LaBonneCarte</h1>
            </div>
            <p>Affiche les résultats de vos recherches Leboncoin directement sur une carte.</p>
            <h3>Comment ça marche ?</h3>
            <ul>
                <li>Après avoir activé l'extension, <strong>un bouton apparaitra en bas à gauche</strong> de votre écran sur leboncoin.fr</li>
                <li>La carte permet uniquement d'afficher les résultats <strong>de la page actuelle</strong> sous forme de marqueurs.</li>
                <li>Les marqueurs sont groupés par code postal. Leboncoin ne donne malheureusement pas d'information sur une adresse plus précise que cela.</li>
            </ul>
            <hr />
            <p>Version 4.0.0</p>
            <p>Projet open-source. N'hésitez pas à <a href="https://github.com/YoamFarges/LaBonneCarte" target="_blank">contribuer sur github</a></p>

            <a href="https://www.paypal.com/donate/?business=CLUEYVJ9VQXLG&no_recurring=0&item_name=Pour+faire+vivre+et+possiblement+%C3%A9voluer+LaBonneCarte+%E2%9D%A4%EF%B8%8F%E2%80%8D%F0%9F%94%A5&currency_code=EUR" target="_blank">Offrez-moi un café ☕️</a>

        </div>
    )
}

export default LBCAPopup

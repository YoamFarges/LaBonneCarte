import type { GeocodedItem } from "~shared/parser/item";

enum MessageType {
    ItemsDisplayed,
    NoItems_OnHomepage,
    NoItems_OnAnyOtherPage,
}

const DisclaimerMessage = ({ geocodedItems }: { geocodedItems: GeocodedItem[] }) => {
    const currentPageUrl = window.location.toString();
    const homepageUrl = "https://www.leboncoin.fr/";

    let messageType = MessageType.NoItems_OnAnyOtherPage;
    if (geocodedItems.length > 0) {
        messageType = MessageType.ItemsDisplayed;
    } else if (currentPageUrl === homepageUrl) {
        messageType = MessageType.NoItems_OnHomepage;
    }

    const className = messageType === MessageType.ItemsDisplayed ? "" : "lbca_disclaimer_no_items";
    const mailto = {
        email: "yoam.farges+labonnecarte@gmail.com",
        subject: "LaBonneCarte - Problème",
        body: `Bonjour,%0D%0A%0D%0AIl semblerait qu'il y ait un problème sur la page suivante ${currentPageUrl}. %0D%0A%0D%0ADESCRIPTION DU PROBLÈME:%0D%0A%0D%0A`
    };

    return (
        <div id="lbca_disclaimer" className={className}>
            {messageType === MessageType.ItemsDisplayed &&
                <>
                    <span className="title">{geocodedItems.length } {geocodedItems.length > 1 ? "annonces trouvées" : "annonce trouvée"} sur la page.</span> La position des annonces est approximative. Il est possible que certaines annonces ne soient pas affichées. 
                </>
            }
            {messageType === MessageType.NoItems_OnHomepage &&
                <>
                    <span className="title">Vous êtes sur la page d'accueil de Leboncoin.</span> Sur cette page, aucune annonce n'est affichée sur la carte.
                </>
            }
            {messageType === MessageType.NoItems_OnAnyOtherPage &&
                <>
                    <span className="title">Aucune annonce n'a été trouvée sur cette page.</span> Si vous pensez qu'il s'agit d'une erreur, merci d'envoyer <a href={`mailto:${mailto.email}?subject=${mailto.subject}&body=${mailto.body}`}>un e-mail à l'auteur de l'extension</a>.
                </>
            }
        </div>
    );
};

export default DisclaimerMessage;
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useRecentCards, useNewestSet, type CardListItem } from '@/hooks/usePokemonApi'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'
import { Button } from '@/components/ui/button'
import Autoplay from 'embla-carousel-autoplay'
import bannerImg from '@/assets/banner.png'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  const navigate = useNavigate()
  const { cards: recentCards, isLoading: loadingRecent } = useRecentCards(30)
  const newestSet = useNewestSet()

  const viewCard = (cardId: string) => {
    navigate({ to: '/cards/$cardId', params: { cardId } })
  }

  const goToNewReleases = () => {
    if (newestSet) {
      navigate({ to: '/cards', search: { set: newestSet.id } })
    }
  }

  const goToPokemon = (name: string) => {
    navigate({ to: '/cards', search: { name } })
  }

  const heroCards = recentCards.slice(0, 6)
  const sliderCards1 = recentCards.slice(6, 18)
  const sliderCards2 = recentCards.slice(18)

  return (
    <div className="flex flex-col" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div
        className="h-[35vh] flex flex-col justify-center items-center text-white gap-2 relative overflow-hidden mb-20"
        style={{
          backgroundImage: `url(${bannerImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <h1 className="relative z-10 text-4xl md:text-5xl font-extrabold tracking-tight bg-linear-to-r from-[#d9d0ff] via-white to-[#d9d0ff] bg-clip-text text-transparent m-0 drop-shadow-lg">
          New Cards!
        </h1>
        <p className="relative z-10 text-sm md:text-base text-(--text-secondary) font-medium m-0 opacity-80">
          Discover the latest Pokémon TCG releases
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 relative -mt-24 md:-mt-32 px-4 md:px-20 lg:px-40 pb-10">
        {loadingRecent ? (
          <div className="flex gap-4 w-full justify-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton w-48 h-64 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="w-full max-w-[60vw]">
            <Carousel
              opts={{ loop: true, align: 'start' }}
              plugins={[Autoplay({ delay: 2500, stopOnInteraction: true, stopOnMouseEnter: true })]}
            >
              <CarouselContent>
                {heroCards.map((card) => (
                  <CarouselItem key={card.id} className="basis-1/3 flex justify-center">
                    <CardImage card={card} onClick={() => viewCard(card.id)} size="large" />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        )}

        <Button asChild className="bg-(--accent-purple) text-white text-base md:text-lg font-semibold px-8 py-3 uppercase rounded-full transition-all duration-200 hover:scale-105 hover:shadow-[0_0_24px_rgba(136,59,207,0.4)] hover:bg-(--accent-purple)/90">
          <Link to="/cards">
            See all cards
          </Link>
        </Button>

        <div className="w-full max-w-md h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
      </div>

      <div className="flex flex-col gap-0">
        {/* ── New Releases Section ─────────────────── */}
        <section className="flex flex-col md:flex-row w-full">
          <div className="flex-1 flex flex-col items-center justify-evenly gap-5 px-6 md:px-16 py-12">
            <h2 className="text-2xl md:text-3xl font-extrabold uppercase text-center m-0 tracking-tight bg-linear-to-r from-[#d9d0ff] to-white bg-clip-text text-transparent">
              New Releases!
            </h2>
            <span className="text-base md:text-lg text-center text-(--text-secondary) px-4 md:px-12 leading-relaxed">
              Check out all the new awesome cards released in the latest set
              of Pokémon TCG, this ever expanding card game!
            </span>
            <Button
              onClick={goToNewReleases}
              className="bg-white text-[#131217] text-base md:text-lg font-semibold px-8 py-3 uppercase rounded-full transition-all duration-200 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:text-white cursor-pointer"
            >
              CHECK OUT
            </Button>
          </div>
          <div className="flex-1 p-4 md:p-6">
            <img
              src="https://assetsio.gnwcdn.com/pokemon_tcg_ex_raidons_preview.png?width=1200&height=630&fit=crop&enable=upscale&auto=webp"
              alt="New Pokemon TCG cards"
              className="w-full h-full object-cover rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            />
          </div>
        </section>

        {/* ── Recent Cards Slider ──────────────────── */}
        <div className="px-4 md:px-12 py-6">
          {!loadingRecent && sliderCards1.length > 0 && (
            <Carousel
              opts={{ loop: true, align: 'start' }}
              plugins={[Autoplay({ delay: 2000, stopOnInteraction: true, stopOnMouseEnter: true })]}
            >
              <CarouselContent>
                {sliderCards1.map((card) => (
                  <CarouselItem key={card.id} className="basis-1/5 flex justify-center">
                    <CardImage card={card} onClick={() => viewCard(card.id)} size="small" />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          )}
        </div>

        {/* ── Expansions Section ───────────────────── */}
        <section className="flex flex-col-reverse md:flex-row-reverse w-full bg-white/[0.03] border-y border-white/[0.06]">
          <div className="flex-1 flex flex-col items-center justify-evenly gap-5 px-6 md:px-16 py-12">
            <h2 className="text-2xl md:text-3xl font-extrabold uppercase text-center m-0 tracking-tight bg-linear-to-r from-[#d9d0ff] to-white bg-clip-text text-transparent">
              Expansions!
            </h2>
            <span className="text-base md:text-lg text-center text-(--text-secondary) px-4 md:px-12 leading-relaxed">
              Check out all the sets and expansions released so far, including
              all of its cards and their information!
            </span>
            <Button asChild className="bg-(--accent-purple) text-white text-base md:text-lg font-semibold px-8 py-3 uppercase rounded-full transition-all duration-200 hover:scale-105 hover:shadow-[0_0_24px_rgba(136,59,207,0.4)] hover:bg-(--accent-purple)/90">
              <Link to="/sets">
                CHECK OUT
              </Link>
            </Button>
          </div>
          <div className="flex-1 p-4 md:p-6">
            <img
              src="https://www.pokemon.com/static-assets/content-assets/cms2/img/attend-events/_tiles/2021/tcg-rotation/tcg-2021-rotation-169-en.jpg"
              alt="Pokemon TCG Expansions"
              className="w-full h-full object-cover rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            />
          </div>
        </section>

        {/* ── Featured Cards ──────────────────────── */}
        <div className="px-4 md:px-12 pt-10">
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight bg-linear-to-r from-[#d9d0ff] to-white bg-clip-text text-transparent">
            Featured cards
          </h2>
        </div>
        <div className="px-4 md:px-12 pb-6">
          {!loadingRecent && sliderCards2.length > 0 && (
            <Carousel
              opts={{ loop: true, align: 'start' }}
              plugins={[Autoplay({ delay: 2500, stopOnInteraction: true, stopOnMouseEnter: true })]}
            >
              <CarouselContent>
                {sliderCards2.map((card) => (
                  <CarouselItem key={card.id} className="basis-1/5 flex justify-center">
                    <CardImage card={card} onClick={() => viewCard(card.id)} size="small" />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          )}
          {loadingRecent && (
            <div className="flex gap-4 justify-center">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton w-36 h-52 rounded-xl" />
              ))}
            </div>
          )}
        </div>

        {/* ── Popular Pokemon ─────────────────────── */}
        <section className="flex flex-col py-10 px-4 md:px-12 bg-white/[0.03] border-t border-white/[0.06]">
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight bg-linear-to-r from-[#d9d0ff] to-white bg-clip-text text-transparent mb-6">
            Popular Pokémon
          </h2>
          <div className="flex flex-wrap md:flex-nowrap h-[300px] md:h-[350px] gap-4">
            <div className="flex flex-col flex-1 min-w-[120px] gap-4">
              <PokemonButton name="charizard" bgColor="#e65100" bgImage="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png" onClick={() => goToPokemon('charizard')} />
            </div>
            <div className="flex flex-col flex-1 min-w-[120px] gap-4">
              <PokemonButton name="pikachu" bgColor="#f9a825" bgImage="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" onClick={() => goToPokemon('pikachu')} />
              <PokemonButton name="eevee" bgColor="#8d6e63" bgImage="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png" onClick={() => goToPokemon('eevee')} />
            </div>
            <div className="hidden md:flex flex-col flex-1 min-w-[120px] gap-4">
              <PokemonButton name="snorlax" bgColor="#37474f" bgImage="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png" onClick={() => goToPokemon('snorlax')} />
            </div>
            <div className="hidden md:flex flex-col flex-1 min-w-[120px] gap-4">
              <PokemonButton name="mew" bgColor="#ec407a" bgImage="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/151.png" onClick={() => goToPokemon('mew')} />
              <PokemonButton name="gengar" bgColor="#5e35b1" bgImage="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png" onClick={() => goToPokemon('gengar')} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function CardImage({ card, onClick, size }: { card: CardListItem; onClick: () => void; size: 'large' | 'small' }) {
  const imgUrl = `${card.image}/${size === 'large' ? 'high' : 'low'}.webp`
  const heightClass = size === 'large'
    ? 'h-[180px] sm:h-[250px] md:h-[320px]'
    : 'h-[80px] sm:h-[120px] md:h-[200px] lg:h-[250px]'
  return (
    <div onClick={onClick} className="cursor-pointer transition-all duration-200 hover:scale-95 hover:brightness-110 flex justify-center">
      <img src={imgUrl} alt={card.name} loading="lazy" className={`rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] ${heightClass}`} />
    </div>
  )
}

function PokemonButton({ name, bgColor, bgImage, onClick }: { name: string; bgColor: string; bgImage: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex-1 rounded-xl flex justify-end items-end p-4 cursor-pointer transition-all duration-200 hover:scale-[1.04] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] bg-no-repeat bg-contain overflow-hidden relative"
      style={{ backgroundColor: bgColor, backgroundImage: `url(${bgImage})`, backgroundPosition: 'center top', backgroundSize: '80%', minHeight: '100px' }}
    >
      <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
      <span className="text-white text-xl md:text-2xl lg:text-3xl font-bold z-10 drop-shadow-lg capitalize">{name}</span>
    </div>
  )
}
